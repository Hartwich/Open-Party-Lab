import { normalizeLanguage, type GamePlayerSetupDefinition } from "@open-party-lab/game-core";
import { hasActiveRound, ROOM_EXTENSION_WINDOW_MS } from "@open-party-lab/protocol";
import type {
  AckResult,
  ClientToServerEvents,
  InterServerEvents,
  PlayerSetupValue,
  ServerToClientEvents,
  SocketData
} from "@open-party-lab/protocol";
import { now } from "../../core/time/now.js";
import { GameRegistry } from "../../game-engine/gameRegistry.js";
import { GameRuntime } from "../../game-engine/gameRuntime.js";
import { StateBroadcaster } from "../../game-engine/stateBroadcaster.js";
import { PlayerManager } from "../../players/playerManager.js";
import { ReconnectService } from "../../players/reconnectService.js";
import { canStartRound, explainCannotStartRound } from "../../rooms/roomLifecycle.js";
import { RoomManager } from "../../rooms/roomManager.js";
import { getRoomText } from "../../rooms/roomText.js";
import { assignPlayerSetup } from "../../rooms/playerSetupAssignments.js";
import { RoomCleanupService } from "../../rooms/roomCleanupService.js";
import { createGuardedOn } from "./guardClientEvents.js";
import { socketText } from "./socketText.js";

type IoServer = import("socket.io").Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type RoomSocket = import("socket.io").Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export interface RegisterSocketHandlersDeps {
  io: IoServer;
  roomManager: RoomManager;
  playerManager: PlayerManager;
  reconnectService: ReconnectService;
  gameRegistry: GameRegistry;
  gameRuntime: GameRuntime;
  stateBroadcaster: StateBroadcaster;
  roomCleanupService: RoomCleanupService;
  hostedMode: boolean;
}

function ackError<T>(message: string): AckResult<T> {
  return { ok: false, error: message };
}

function getPlayerSetupSelectionKey(setup: GamePlayerSetupDefinition): string {
  return setup.selectionKey ?? "character";
}

function normalizePlayerSetupValue(
  setup: GamePlayerSetupDefinition,
  value: PlayerSetupValue
): PlayerSetupValue | null {
  const validOptionIds = new Set(setup.options.map((option) => option.id));

  if (setup.kind === "choice") {
    return typeof value === "string" && validOptionIds.has(value) ? value : null;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = [...new Set(value.filter((entry) => validOptionIds.has(entry)))].slice(0, setup.maxSelections);

  if (normalized.length !== value.length) {
    return null;
  }

  return normalized;
}

function clearSocketIdentity(socket: RoomSocket): void {
  if (socket.data.roomCode) {
    socket.leave(socket.data.roomCode);
  }

  delete socket.data.role;
  delete socket.data.roomCode;
  delete socket.data.playerId;
}

export function registerSocketHandlers({
  io,
  roomManager,
  playerManager,
  reconnectService,
  gameRegistry,
  gameRuntime,
  stateBroadcaster,
  roomCleanupService,
  hostedMode
}: RegisterSocketHandlersDeps): void {
  // A socket has one identity in one room. Repeated joins/resumes of that
  // identity are idempotent, while an explicit switch releases the old room.
  function leavePreviousIdentity(
    socket: RoomSocket,
    nextRole: "host" | "controller",
    nextRoomCode: string,
    nextPlayerId?: string
  ): void {
    if (
      socket.data.role === nextRole && socket.data.roomCode === nextRoomCode &&
      (nextRole === "host" || socket.data.playerId === nextPlayerId)
    ) return;

    const room = socket.data.roomCode ? roomManager.getRoom(socket.data.roomCode) : undefined;
    if (room) {
      if (socket.data.role === "host") {
        roomManager.clearHostSocket(room, socket.id);
      } else if (socket.data.role === "controller" && socket.data.playerId) {
        const player = room.players.get(socket.data.playerId);
        if (player?.socketId === socket.id) {
          const result = playerManager.removePlayer(room, player.id);
          // A running round keeps its participants and their scores. Mark the
          // departing participant disconnected instead of altering the roster.
          if ("error" in result) {
            playerManager.disconnectPlayer(room, socket.id);
            playerManager.setReady(room, player.id, false);
          }
          roomManager.forgetHostControlForPlayer(room, player.id);
        }
      }
      roomManager.touch(room);
    }
    clearSocketIdentity(socket);
    if (room) {
      stateBroadcaster.broadcastRoomState(room);
      stateBroadcaster.broadcastScoreboard(room);
      if (room.currentRound) stateBroadcaster.broadcastGameState(room);
    }
  }

  function replacePreviousControllers(room: NonNullable<ReturnType<RoomManager["getRoom"]>>, playerId: string, socket: RoomSocket): void {
    for (const socketId of [...(io.sockets.adapter.rooms.get(room.code) ?? [])]) {
      const previous = io.sockets.sockets.get(socketId);
      if (!previous || previous.id === socket.id || previous.data.role !== "controller" ||
          previous.data.playerId !== playerId) continue;

      previous.emit("session:terminated", {
        roomCode: room.code,
        playerId,
        reason: "replaced",
        message: socketText(room.language).sessionReplaced
      });
      // Clear before disconnect so the old transport cannot mark the newly
      // bound player offline or trigger another automatic session takeover.
      clearSocketIdentity(previous);
      previous.disconnect(true);
    }
  }

  /**
   * Single authorisation gate for every room-driving action.
   *
   * Historically each handler compared `socket.data.role` against `"host"`.
   * With remote host control there are two legitimate drivers: the shared
   * screen, and the one player it has handed the controls to. Routing every
   * check through here keeps the two in sync — a new host action cannot forget
   * to honour a delegation.
   */
  function canControlRoom(
    room: NonNullable<ReturnType<RoomManager["getRoom"]>>,
    socket: RoomSocket
  ): boolean {
    if (socket.data.roomCode !== room.code) {
      return false;
    }

    if (socket.data.role === "host") {
      return true;
    }

    return (
      socket.data.role === "controller" && roomManager.hasHostControl(room, socket.data.playerId)
    );
  }

  function getSelectedGame(room: NonNullable<ReturnType<RoomManager["getRoom"]>>) {
    const game = room.selectedGameId ? gameRegistry.getAvailableGame(room.selectedGameId, room.language, room.gameSettingsByGameId[room.selectedGameId]) : undefined;
    if (game) assignPlayerSetup(room, game);
    return game;
  }

  function resetInvalidPlayerSetupSelections(
    room: NonNullable<ReturnType<RoomManager["getRoom"]>>,
    selectedGame: ReturnType<typeof getSelectedGame>
  ): void {
    const setup = selectedGame?.playerSetup;

    if (!selectedGame || !setup) {
      for (const player of room.players.values()) {
        player.selectedCharacterId = null;
      }

      return;
    }

    const selectionKey = getPlayerSetupSelectionKey(setup);

    for (const player of room.players.values()) {
      const currentSelections = player.setupSelectionsByGameId[selectedGame.id] ?? {};
      const value = currentSelections[selectionKey];
      const normalized = value === undefined ? undefined : normalizePlayerSetupValue(setup, value);

      if (normalized !== null && normalized !== undefined) {
        if (setup.kind === "choice") {
          player.selectedCharacterId = normalized as string;
        }

        continue;
      }

      const nextSelections = { ...currentSelections };
      delete nextSelections[selectionKey];

      player.setupSelectionsByGameId = {
        ...player.setupSelectionsByGameId,
        [selectedGame.id]: nextSelections
      };

      if (setup.kind === "choice") {
        player.selectedCharacterId = null;
      }
    }
  }

  function resetLobbySetupConfirmation(
    room: NonNullable<ReturnType<RoomManager["getRoom"]>>,
    selectedGame: ReturnType<typeof getSelectedGame>
  ): void {
    const confirmation = selectedGame?.lobbySetup?.confirmation;

    if (!selectedGame || !confirmation) {
      return;
    }

    const currentSettings = room.gameSettingsByGameId[selectedGame.id] ?? {};
    room.gameSettingsByGameId = {
      ...room.gameSettingsByGameId,
      [selectedGame.id]: {
        ...currentSettings,
        [confirmation.settingKey]: false
      }
    };
  }

  function startReadyLockedRound(room: NonNullable<ReturnType<RoomManager["getRoom"]>>) {
    // Every path into a new round goes through here, so this is the one place
    // that has to guarantee it does not begin frozen.
    roomManager.clearPause(room);
    const startedState = gameRuntime.startRound(room);

    if (!startedState) {
      return false;
    }

    const selectedGame = getSelectedGame(room);

    if (selectedGame?.roundCompletionMode === "wait_for_ready") {
      playerManager.setAllReady(room, false);
    }

    stateBroadcaster.broadcastRoomState(room);
    stateBroadcaster.broadcastGameState(room);
    stateBroadcaster.broadcastScoreboard(room);

    return true;
  }

  function maybeAutoStartReadyRound(roomCode: string): boolean {
    const room = roomManager.getRoom(roomCode);

    if (!room || !room.selectedGameId) {
      return false;
    }

    if (hasActiveRound(room)) {
      return false;
    }

    const selectedGame = getSelectedGame(room);

    if (selectedGame?.roundCompletionMode !== "wait_for_ready") {
      return false;
    }

    // Only an explicit "no" from a game with a continuing run blocks the next
    // round. Games without that rule fall through to the normal readiness check.
    if (
      room.currentRound?.phase === "finished" &&
      gameRuntime.shouldContinueRun(room) === false
    ) {
      return false;
    }

    if (!canStartRound(room, selectedGame)) {
      return false;
    }

    return startReadyLockedRound(room);
  }

  io.on("connection", (socket) => {
    // Every client event goes through this instead of socket.on: it normalises
    // the arguments a well-behaved client would have sent and keeps a fault in
    // one handler from ending the process for every room on the server.
    const on = createGuardedOn(socket);

    socket.use((_event, next) => {
      const roomCode = socket.data.roomCode;
      const room = roomCode ? roomManager.getRoom(roomCode) : undefined;

      if (room) roomManager.touch(room);
      next();
    });

    socket.emit("server:hello", {
      serverTime: now(),
      recoveryEnabled: true
    });

    on("server:time", (_payload, ack) => {
      if (typeof ack === "function") ack(now());
    });

    on("room:create", (payload, ack) => {
      const hostName = payload.hostName?.trim() || "Host";
      const requestedRoomCode = payload.roomCode?.trim().toUpperCase();
      const existingRoom = requestedRoomCode ? roomManager.getRoom(requestedRoomCode) : undefined;
      const createLocalPrimaryRoom = !hostedMode && !!requestedRoomCode && !existingRoom && roomManager.isPrimaryRoomCode(requestedRoomCode);

      if (!requestedRoomCode || createLocalPrimaryRoom) {
        const capacity = roomCleanupService.prepareForRoomCreation();

        if (!capacity.ok) {
          const text = getRoomText(normalizeLanguage(payload.language));
          ack(ackError(text.capacity(roomCleanupService.getMaxRoomCount())));
          return;
        }
      }

      const room = requestedRoomCode && !createLocalPrimaryRoom
        ? existingRoom
        : roomManager.createRoom(hostName, normalizeLanguage(payload.language));

      if (!room) {
        ack(ackError(socketText(normalizeLanguage(payload.language)).roomCodeNotFound));
        return;
      }

      leavePreviousIdentity(socket, "host", room.code);
      roomManager.attachHostSocket(room, socket.id, hostName);

      socket.data.role = "host";
      socket.data.roomCode = room.code;
      socket.join(room.code);

      ack({
        ok: true,
        data: {
          room: stateBroadcaster.createRoomSnapshot(room)
        }
      });

      stateBroadcaster.broadcastRoomState(room);
      stateBroadcaster.broadcastScoreboard(room);

      if (room.currentRound) {
        stateBroadcaster.broadcastGameState(room, { forceFullHostState: true });
      }
    });

    on("room:set-language", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        ack(ackError("Raum nicht gefunden."));
        return;
      }
      const text = socketText(room.language);

      if (!canControlRoom(room, socket)) {
        ack(ackError(text.hostLanguageOnly));
        return;
      }

      roomManager.setLanguage(room, normalizeLanguage(payload.language, room.language));

      ack({
        ok: true,
        data: {
          room: stateBroadcaster.createRoomSnapshot(room)
        }
      });

      stateBroadcaster.broadcastRoomState(room);
      stateBroadcaster.broadcastScoreboard(room);

      if (room.currentRound) {
        stateBroadcaster.broadcastGameState(room);
      }
    });

    on("room:set-theme", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        ack(ackError("Raum nicht gefunden."));
        return;
      }
      const text = socketText(room.language);

      if (!canControlRoom(room, socket)) {
        ack(ackError(text.hostThemeOnly));
        return;
      }

      roomManager.setTheme(room, payload.theme);

      ack({ ok: true, data: { room: stateBroadcaster.createRoomSnapshot(room) } });
      stateBroadcaster.broadcastRoomState(room);
    });

    on("room:extend-lifetime", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);
      const text = getRoomText(room?.language);

      if (!hostedMode) {
        ack(ackError(text.hostedOnly));
        return;
      }

      if (!room) {
        ack(ackError(socketText().roomNotFound));
        return;
      }

      if (socket.data.role !== "host" || socket.data.roomCode !== room.code || !room.hostSocketIds.has(socket.id)) {
        ack(ackError(text.extendHostOnly));
        return;
      }

      if (room.expiresAt === null || room.expiresAt <= now()) {
        ack(ackError(text.alreadyExpired));
        return;
      }

      if (room.expiresAt - now() > ROOM_EXTENSION_WINDOW_MS) {
        ack(ackError(text.extendWindow));
        return;
      }

      roomCleanupService.extendRoomLifetime(room);
      stateBroadcaster.broadcastRoomState(room);
      ack({ ok: true, data: { room: stateBroadcaster.createRoomSnapshot(room) } });
    });

    on("room:join", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        ack(ackError(socketText(normalizeLanguage(payload.language)).roomCodeNotFound));
        return;
      }
      const text = socketText(room.language);

      const playerName = payload.playerName.trim();

      if (!playerName) {
        ack(ackError(text.enterPlayerName));
        return;
      }

      const existingPlayer = [...room.players.values()].find((player) => player.deviceId === payload.deviceId);
      leavePreviousIdentity(socket, "controller", room.code, existingPlayer?.id);
      const result = playerManager.joinPlayer(room, payload, socket.id);
      const player = result.player;
      replacePreviousControllers(room, player.id, socket);
      roomManager.touch(room);

      socket.data.role = "controller";
      socket.data.roomCode = room.code;
      socket.data.playerId = player.id;
      socket.join(room.code);

      ack({
        ok: true,
        data: {
          room: stateBroadcaster.createRoomSnapshot(room),
          player: playerManager.toSnapshot(player),
          reconnectToken: player.reconnectToken
        }
      });

      stateBroadcaster.broadcastRoomState(room);
      stateBroadcaster.broadcastScoreboard(room);

      if (room.currentRound) {
        stateBroadcaster.sendControllerGameState(socket, room);
        stateBroadcaster.broadcastGameState(room);
      }
    });

    on("session:resume", (payload, ack) => {
      const session = reconnectService.getSession(payload.reconnectToken);

      if (!session) {
        ack(ackError(socketText(normalizeLanguage(payload.language)).sessionNotFound));
        return;
      }

      const room = roomManager.getRoom(session.roomCode);

      if (!room) {
        ack(ackError(socketText(normalizeLanguage(payload.language)).sessionRoomGone));
        return;
      }
      const text = socketText(room.language);

      const resumablePlayer = room.players.get(session.playerId);
      if (!resumablePlayer || resumablePlayer.deviceId !== payload.deviceId ||
          resumablePlayer.reconnectToken !== payload.reconnectToken) {
        ack(ackError(text.sessionRestoreFailed));
        return;
      }
      leavePreviousIdentity(socket, "controller", room.code, resumablePlayer.id);
      const player = playerManager.resumePlayer(
        room,
        payload.reconnectToken,
        payload.deviceId,
        socket.id
      );

      if (!player) {
        ack(ackError(text.sessionRestoreFailed));
        return;
      }

      replacePreviousControllers(room, player.id, socket);
      roomManager.touch(room);

      socket.data.role = "controller";
      socket.data.roomCode = room.code;
      socket.data.playerId = player.id;
      socket.join(room.code);

      const roomSnapshot = stateBroadcaster.createRoomSnapshot(room);
      const playerSnapshot = playerManager.toSnapshot(player);

      ack({
        ok: true,
        data: {
          room: roomSnapshot,
          player: playerSnapshot,
          reconnectToken: player.reconnectToken
        }
      });

      socket.emit("session:resumed", {
        room: roomSnapshot,
        player: playerSnapshot,
        reconnectToken: player.reconnectToken
      });

      stateBroadcaster.broadcastRoomState(room);
      stateBroadcaster.broadcastScoreboard(room);

      if (room.currentRound) {
        stateBroadcaster.sendControllerGameState(socket, room);
        stateBroadcaster.broadcastGameState(room);
      }
    });

    on("room:leave", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        ack(ackError("Raum nicht gefunden."));
        return;
      }
      const text = socketText(room.language);

      if (socket.data.role !== "controller" || socket.data.roomCode !== room.code || !socket.data.playerId) {
        ack(ackError(text.ownSessionOnly));
        return;
      }

      const result = playerManager.removePlayer(room, socket.data.playerId);

      if ("error" in result) {
        ack(ackError(result.error));
        return;
      }

      roomManager.forgetHostControlForPlayer(room, result.player.id);

      ack({
        ok: true,
        data: {
          room: stateBroadcaster.createRoomSnapshot(room)
        }
      });

      socket.emit("session:terminated", {
        roomCode: room.code,
        playerId: result.player.id,
        reason: "left",
        message: text.leftRoom
      });

      clearSocketIdentity(socket);
      socket.disconnect(true);

      stateBroadcaster.broadcastRoomState(room);
      stateBroadcaster.broadcastScoreboard(room);

      if (room.currentRound) {
        stateBroadcaster.broadcastGameState(room);
      }
    });

    on("player:kick", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        ack(ackError("Raum nicht gefunden."));
        return;
      }
      const text = socketText(room.language);

      if (!canControlRoom(room, socket)) {
        ack(ackError(text.hostKickOnly));
        return;
      }

      const result = playerManager.removePlayer(room, payload.playerId);

      if ("error" in result) {
        ack(ackError(result.error));
        return;
      }

      // A kicked player must not keep driving the room.
      roomManager.forgetHostControlForPlayer(room, result.player.id);

      ack({
        ok: true,
        data: {
          room: stateBroadcaster.createRoomSnapshot(room)
        }
      });

      const targetSocketId = result.socketId;

      if (targetSocketId) {
        const targetSocket = io.sockets.sockets.get(targetSocketId);

        if (targetSocket) {
          targetSocket.emit("session:terminated", {
            roomCode: room.code,
            playerId: result.player.id,
            reason: "kicked",
            message: text.kicked
          });
          clearSocketIdentity(targetSocket);
          targetSocket.disconnect(true);
        }
      }

      stateBroadcaster.broadcastRoomState(room);
      stateBroadcaster.broadcastScoreboard(room);

      if (room.currentRound) {
        stateBroadcaster.broadcastGameState(room);
      }
    });

    on("player:ready", (payload) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        stateBroadcaster.emitError(socket, "room/not-found", "Raum nicht gefunden.");
        return;
      }
      const text = socketText(room.language);

      const player = playerManager.setReady(room, payload.playerId, payload.isReady);

      if (!player) {
        stateBroadcaster.emitError(socket, "player/not-found", text.playerNotFound);
        return;
      }

      stateBroadcaster.broadcastRoomState(room);
      maybeAutoStartReadyRound(room.code);
    });

    on("player:set-profile", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);
      const text = getRoomText(room?.language);
      const player = room?.players.get(payload.playerId);
      if (!room || !player || socket.data.role !== "controller" ||
          socket.data.roomCode !== room.code || socket.data.playerId !== player.id || player.socketId !== socket.id) {
        ack(ackError(text.profileOwnOnly));
        return;
      }
      if (hasActiveRound(room)) {
        ack(ackError(text.profileLobbyOnly));
        return;
      }
      const name = typeof payload.name === "string" ? payload.name.trim() : "";
      const avatar = payload.avatar;
      if (!name || name.length > 32 || (avatar !== null &&
          (typeof avatar !== "string" || avatar.length > 35_000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar)))) {
        ack(ackError(text.profileInvalid));
        return;
      }
      player.name = name;
      player.avatar = avatar;
      ack({ ok: true, data: { room: stateBroadcaster.createRoomSnapshot(room), player: playerManager.toSnapshot(player), reconnectToken: player.reconnectToken } });
      stateBroadcaster.broadcastRoomState(room);
      stateBroadcaster.broadcastScoreboard(room);
    });

    on("player:select-character", (payload) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        stateBroadcaster.emitError(socket, "room/not-found", "Raum nicht gefunden.");
        return;
      }
      const text = socketText(room.language);

      if (socket.data.role !== "controller" || socket.data.playerId !== payload.playerId) {
        stateBroadcaster.emitError(
          socket,
          "player/forbidden",
          text.ownCharacterOnly
        );
        return;
      }

      const selectedGame = getSelectedGame(room);
      const playerSetup = selectedGame?.playerSetup;
      const playerSetupOptions = playerSetup?.kind === "choice" ? playerSetup.options : [];

      if (room.currentRound && room.currentRound.phase !== "finished") {
        stateBroadcaster.emitError(socket, "player/forbidden", text.ownCharacterOnly);
        return;
      }

      if (!playerSetupOptions.some((option) => option.id === payload.characterId)) {
        stateBroadcaster.emitError(socket, "player/not-found", text.characterOrPlayerNotFound);
        return;
      }

      const player = playerManager.setSelectedCharacter(room, payload.playerId, payload.characterId);

      if (!player) {
        stateBroadcaster.emitError(socket, "player/not-found", text.characterOrPlayerNotFound);
        return;
      }

      if (selectedGame && playerSetup) {
        playerManager.setPlayerSetup(
          room,
          payload.playerId,
          selectedGame.id,
          getPlayerSetupSelectionKey(playerSetup),
          payload.characterId
        );
      }

      stateBroadcaster.broadcastRoomState(room);
      maybeAutoStartReadyRound(room.code);
    });

    on("player:set-setup", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        ack(ackError("Raum nicht gefunden."));
        return;
      }
      const text = socketText(room.language);

      if (socket.data.role !== "controller" || socket.data.playerId !== payload.playerId) {
        ack(ackError(text.ownCharacterOnly));
        return;
      }

      const selectedGame = getSelectedGame(room);
      const setup = selectedGame?.playerSetup;

      if (room.currentRound && room.currentRound.phase !== "finished") {
        ack(ackError(text.characterOrPlayerNotFound));
        return;
      }

      if (!selectedGame || !setup || getPlayerSetupSelectionKey(setup) !== payload.selectionKey) {
        ack(ackError(text.characterOrPlayerNotFound));
        return;
      }

      const normalizedValue = normalizePlayerSetupValue(setup, payload.value);

      if (normalizedValue === null) {
        ack(ackError(text.characterOrPlayerNotFound));
        return;
      }

      const player = playerManager.setPlayerSetup(
        room,
        payload.playerId,
        selectedGame.id,
        payload.selectionKey,
        normalizedValue
      );

      if (!player) {
        ack(ackError(text.playerNotFound));
        return;
      }

      if (setup.kind === "choice" && typeof normalizedValue === "string") {
        player.selectedCharacterId = normalizedValue;
      }

      ack({
        ok: true,
        data: {
          room: stateBroadcaster.createRoomSnapshot(room),
          player: playerManager.toSnapshot(player)
        }
      });

      stateBroadcaster.broadcastRoomState(room);
      maybeAutoStartReadyRound(room.code);
    });

    on("host-control:request", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        ack(ackError("Raum nicht gefunden."));
        return;
      }
      const text = socketText(room.language);

      if (
        socket.data.role !== "controller" ||
        socket.data.roomCode !== room.code ||
        socket.data.playerId !== payload.playerId ||
        !room.players.has(payload.playerId)
      ) {
        ack(ackError(text.hostControlPlayersOnly));
        return;
      }

      // Free controls are taken, not requested; only a handover between two
      // players is a question, and the room manager decides which this is.
      roomManager.requestHostControl(room, payload.playerId);

      ack({ ok: true, data: { room: stateBroadcaster.createRoomSnapshot(room) } });
      stateBroadcaster.broadcastRoomState(room);
    });

    on("host-control:resolve", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        ack(ackError("Raum nicht gefunden."));
        return;
      }
      const text = socketText(room.language);

      // The question is put to whoever would lose the controls, so the current
      // holder answers it. The shared screen may answer too — it owns the room
      // and is the fallback when the holder's phone is unattended. A player who
      // holds nothing still cannot hand anything to anyone.
      const isScreen = socket.data.role === "host" && socket.data.roomCode === room.code;
      const isCurrentHolder =
        socket.data.role === "controller" &&
        socket.data.roomCode === room.code &&
        roomManager.hasHostControl(room, socket.data.playerId);

      if (!isScreen && !isCurrentHolder) {
        ack(ackError(text.hostControlScreenOnly));
        return;
      }

      if (!roomManager.resolveHostControl(room, payload.playerId, payload.grant)) {
        ack(ackError(text.hostControlNoRequest));
        return;
      }

      ack({ ok: true, data: { room: stateBroadcaster.createRoomSnapshot(room) } });
      stateBroadcaster.broadcastRoomState(room);
    });

    on("host-control:release", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        ack(ackError("Raum nicht gefunden."));
        return;
      }
      const text = socketText(room.language);

      const isScreen = socket.data.role === "host" && socket.data.roomCode === room.code;
      const isHolder =
        socket.data.role === "controller" && roomManager.hasHostControl(room, socket.data.playerId);

      if (!isScreen && !isHolder) {
        ack(ackError(text.hostControlReleaseForbidden));
        return;
      }

      roomManager.releaseHostControl(room);

      ack({ ok: true, data: { room: stateBroadcaster.createRoomSnapshot(room) } });
      stateBroadcaster.broadcastRoomState(room);
    });

    /**
     * Holds or releases the running round.
     *
     * Whoever drives the room may pause it, which is what makes the host menu
     * usable mid-game: opening settings or heading back to the catalog no
     * longer costs everyone the round they were playing.
     */
    on("round:pause", (payload) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        stateBroadcaster.emitError(socket, "room/not-found", "Raum nicht gefunden.");
        return;
      }

      const text = socketText(room.language);

      if (!canControlRoom(room, socket)) {
        stateBroadcaster.emitError(socket, "room/forbidden", text.hostActionOnly);
        return;
      }

      if (!room.currentRound) {
        return;
      }

      const pausedByPlayerId =
        socket.data.role === "controller" ? socket.data.playerId ?? null : null;
      const changed = payload.paused
        ? roomManager.pauseRoom(room, pausedByPlayerId)
        : roomManager.resumeRoom(room);

      if (changed) {
        if (payload.paused) gameRuntime.clearHeldInputs(room);
        stateBroadcaster.broadcastRoomState(room);
        stateBroadcaster.broadcastGameState(room, { reliable: true });
      }
    });

    on("game:select", (payload) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        stateBroadcaster.emitError(socket, "room/not-found", "Raum nicht gefunden.");
        return;
      }
      const text = socketText(room.language);

      if (!canControlRoom(room, socket)) {
        stateBroadcaster.emitError(socket, "room/forbidden", text.hostSelectOnly);
        return;
      }

      try {
        gameRuntime.selectGame(room, payload.gameId);
        stateBroadcaster.clearGameStateCache(room.code);
      } catch {
        stateBroadcaster.emitError(socket, "game/not-found", text.unknownGame);
        return;
      }

      const selectedGame = getSelectedGame(room);
      resetInvalidPlayerSetupSelections(room, selectedGame);
      resetLobbySetupConfirmation(room, selectedGame);

      if (maybeAutoStartReadyRound(room.code)) {
        return;
      }

      stateBroadcaster.broadcastRoomState(room);
      stateBroadcaster.broadcastScoreboard(room);
    });

    on("game:host-action", (payload) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        stateBroadcaster.emitError(socket, "room/not-found", "Raum nicht gefunden.");
        return;
      }
      const text = socketText(room.language);

      if (!canControlRoom(room, socket)) {
        stateBroadcaster.emitError(socket, "room/forbidden", text.hostActionOnly);
        return;
      }

      if (room.selectedGameId !== payload.gameId) {
        stateBroadcaster.emitError(
          socket,
          "game/not-selected",
          text.hostActionWrongGame
        );
        return;
      }

      if (payload.action && typeof payload.action === "object" && "type" in payload.action && payload.action.type === "shuffle-player-setup") {
        const game = getSelectedGame(room);
        if (game?.playerSetup?.kind === "choice" && game.playerSetup.assignment === "balanced-random" &&
          (!room.currentRound || room.currentRound.phase === "finished")) {
          assignPlayerSetup(room, game, true);
          stateBroadcaster.broadcastRoomState(room);
        }
        return;
      }

      const update = gameRuntime.handleHostAction(room, {
        gameId: payload.gameId,
        action: payload.action
      });

      if (!update) {
        stateBroadcaster.emitError(
          socket,
          "game/unsupported-action",
          text.hostActionUnsupported
        );
        return;
      }

      if (maybeAutoStartReadyRound(room.code)) {
        return;
      }

      if (update.roomChanged || update.phaseChanged) {
        stateBroadcaster.broadcastRoomState(room);
      }

      if (update.stateChanged) {
        stateBroadcaster.broadcastGameState(room);
      }

      if (update.scoreChanged) {
        stateBroadcaster.broadcastScoreboard(room);
      }
    });

    on("round:start", (payload) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        stateBroadcaster.emitError(socket, "room/not-found", "Raum nicht gefunden.");
        return;
      }
      const text = socketText(room.language);

      if (!canControlRoom(room, socket)) {
        stateBroadcaster.emitError(socket, "room/forbidden", text.hostStartOnly);
        return;
      }

      const selectedGame = getSelectedGame(room);

      if (selectedGame?.roundCompletionMode === "wait_for_ready") {
        stateBroadcaster.emitError(
          socket,
          "round/not-ready",
          text.readyAutoStart
        );
        return;
      }

      if (!canStartRound(room, selectedGame)) {
        stateBroadcaster.emitError(
          socket,
          "round/not-ready",
          explainCannotStartRound(room, selectedGame) ??
            text.notReadyFallback
        );
        return;
      }

      startReadyLockedRound(room);
    });

    const handleRoundAbort: ClientToServerEvents["round:abort"] = (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        ack(ackError("Raum nicht gefunden."));
        return;
      }
      const text = socketText(room.language);

      if (!canControlRoom(room, socket)) {
        ack(ackError(text.hostAbortOnly));
        return;
      }

      // A round that no longer exists cannot stay held, or the next one would
      // start frozen.
      roomManager.clearPause(room);
      gameRuntime.abortRound(room);
      stateBroadcaster.clearGameStateCache(room.code);
      stateBroadcaster.broadcastRoomState(room);
      stateBroadcaster.broadcastScoreboard(room);

      ack({
        ok: true,
        data: {
          room: stateBroadcaster.createRoomSnapshot(room)
        }
      });
    };

    on("round:abort" as keyof ClientToServerEvents, handleRoundAbort);

    on("game:input", (payload) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        stateBroadcaster.emitError(socket, "room/not-found", "Raum nicht gefunden.");
        return;
      }
      const text = socketText(room.language);

      if (socket.data.role !== "controller" || socket.data.playerId !== payload.playerId) {
        stateBroadcaster.emitError(
          socket,
          "player/forbidden",
          text.ownInputOnly
        );
        return;
      }

      const update = gameRuntime.handleInput(room, {
        playerId: payload.playerId,
        input: payload.input
      });

      if (!update) {
        return;
      }

      // Games that apply inputs inside their tick get the change broadcast by
      // that tick; a broadcast here would only repeat the previous frame.
      if (update.stateChanged && !stateBroadcaster.canDeferInputBroadcast(room, update.phaseChanged)) {
        stateBroadcaster.broadcastGameState(room);
      }

      if (update.phaseChanged) {
        stateBroadcaster.broadcastRoomState(room);
      }

      if (update.scoreChanged) {
        stateBroadcaster.broadcastScoreboard(room);
      }
    });

    socket.on("disconnect", () => {
      const roomCode = socket.data.roomCode;

      if (!roomCode) {
        return;
      }

      const room = roomManager.getRoom(roomCode);

      if (!room) {
        return;
      }

      if (socket.data.role === "host") {
        if (roomManager.clearHostSocket(room, socket.id)) {
          stateBroadcaster.broadcastRoomState(room);
        }
        return;
      }

      if (socket.data.role === "controller") {
        playerManager.disconnectPlayer(room, socket.id);
        roomManager.touch(room);
        stateBroadcaster.broadcastRoomState(room);
      }
    });
  });
}
