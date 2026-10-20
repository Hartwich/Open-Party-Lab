import { normalizeRoomLanguage, type GamePlayerSetupDefinition } from "@open-party-lab/game-core";
import {
  hasActiveRound,
  ROOM_EXTENSION_WINDOW_MS,
  type RoomLanguage
} from "@open-party-lab/protocol";
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
import { RoomCleanupService } from "../../rooms/roomCleanupService.js";
import { createGuardedOn } from "./guardClientEvents.js";

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

function socketText(language: RoomLanguage) {
  const en = language === "en";
  const ar = language === "ar";
  const t = (de: string, english: string, arabic: string) => (ar ? arabic : en ? english : de);
  return {
    roomNotFound: t("Raum nicht gefunden.", "Room not found.", "الغرفة غير موجودة."),
    roomCodeNotFound: t("Raumcode nicht gefunden.", "Room code not found.", "رمز الغرفة غير موجود."),
    enterPlayerName: t("Bitte gib einen Spielernamen ein.", "Please enter a player name.", "يرجى إدخال اسم اللاعب."),
    sessionNotFound: t("Session nicht gefunden.", "Session not found.", "الجلسة غير موجودة."),
    sessionRoomGone: t("Raum zur Session existiert nicht mehr.", "The room for this session no longer exists.", "لم تعد غرفة هذه الجلسة موجودة."),
    sessionRestoreFailed: t("Session konnte nicht wiederhergestellt werden.", "Session could not be restored.", "تعذّرت استعادة الجلسة."),
    ownSessionOnly: t("Du kannst nur deine eigene Session verlassen.", "You can only leave your own session.", "يمكنك مغادرة جلستك فقط."),
    leftRoom: t("Du hast den Raum verlassen.", "You left the room.", "لقد غادرت الغرفة."),
    hostLanguageOnly: t("Nur der Host kann die Sprache aendern.", "Only the host can change the language.", "المضيف فقط يمكنه تغيير اللغة."),
    hostKickOnly: t("Nur der Host kann Spieler kicken.", "Only the host can kick players.", "المضيف فقط يمكنه إخراج اللاعبين."),
    kicked: t("Du wurdest vom Host aus dem Raum entfernt.", "You were removed from the room by the host.", "أزالك المضيف من الغرفة."),
    playerNotFound: t("Spieler nicht gefunden.", "Player not found.", "اللاعب غير موجود."),
    ownCharacterOnly: t("Du darfst nur deinen eigenen Charakter waehlen.", "You can only choose your own character.", "يمكنك اختيار شخصيتك فقط."),
    characterOrPlayerNotFound: t("Charakter oder Spieler nicht gefunden.", "Character or player not found.", "الشخصية أو اللاعب غير موجود."),
    hostSelectOnly: t("Nur der Host kann Spiele waehlen.", "Only the host can choose games.", "المضيف فقط يمكنه اختيار الألعاب."),
    unknownGame: t("Unbekanntes Spiel.", "Unknown game.", "لعبة غير معروفة."),
    hostActionOnly: t("Nur der Host kann Host-Aktionen senden.", "Only the host can send host actions.", "المضيف فقط يمكنه إرسال إجراءات المضيف."),
    hostActionWrongGame: t(
      "Diese Host-Aktion passt nicht zum aktuell ausgewaehlten Spiel.",
      "This host action does not match the currently selected game.",
      "إجراء المضيف هذا لا يطابق اللعبة المحددة حاليًا."
    ),
    hostActionUnsupported: t(
      "Diese Host-Aktion wird vom aktuellen Spiel nicht unterstuetzt.",
      "This host action is not supported by the current game.",
      "هذا الإجراء غير مدعوم من اللعبة الحالية."
    ),
    hostStartOnly: t("Nur der Host kann Runden starten.", "Only the host can start rounds.", "المضيف فقط يمكنه بدء الجولات."),
    readyAutoStart: t(
      "Diese Runde startet automatisch, sobald alle Spieler wieder bereit sind.",
      "This round starts automatically once all players are ready again.",
      "تبدأ هذه الجولة تلقائيًا بمجرد أن يصبح جميع اللاعبين جاهزين مجددًا."
    ),
    notReadyFallback: t(
      "Alle Spieler muessen bereit sein und die Spielerzahl muss passen.",
      "All players must be ready and the player count must fit.",
      "يجب أن يكون جميع اللاعبين جاهزين وأن يناسب عدد اللاعبين."
    ),
    hostAbortOnly: t("Nur der Host kann laufende Runden beenden.", "Only the host can end running rounds.", "المضيف فقط يمكنه إنهاء الجولات الجارية."),
    ownInputOnly: t(
      "Du darfst nur Eingaben fuer deinen eigenen Spieler senden.",
      "You can only send inputs for your own player.",
      "يمكنك إرسال الإدخالات للاعبك فقط."
    ),
    hostThemeOnly: t(
      "Nur der Host kann das Design aendern.",
      "Only the host can change the theme.",
      "المضيف فقط يمكنه تغيير المظهر."
    ),
    hostControlPlayersOnly: t(
      "Nur Spieler in diesem Raum koennen die Steuerung anfragen.",
      "Only players in this room can request host control.",
      "يمكن للاعبين في هذه الغرفة فقط طلب التحكم بالمضيف."
    ),
    hostControlAlreadyHeld: t(
      "Ein anderer Spieler hat die Steuerung bereits.",
      "Another player already has host control.",
      "لاعب آخر يملك التحكم بالمضيف بالفعل."
    ),
    hostControlScreenOnly: t(
      "Nur der Bildschirm kann Uebernahme-Anfragen beantworten.",
      "Only the shared screen can answer takeover requests.",
      "الشاشة المشتركة فقط يمكنها الرد على طلبات الاستيلاء."
    ),
    hostControlNoRequest: t(
      "Es liegt keine Uebernahme-Anfrage vor.",
      "There is no pending takeover request.",
      "لا يوجد طلب استيلاء معلّق."
    ),
    hostControlReleaseForbidden: t(
      "Nur der Bildschirm oder der aktuelle Halter kann die Steuerung zurueckgeben.",
      "Only the shared screen or the current holder can hand control back.",
      "الشاشة المشتركة أو الحامل الحالي فقط يمكنه إعادة التحكم."
    )
  };
}

function clearSocketIdentity(socket: {
  data: { role?: "host" | "controller"; roomCode?: string; playerId?: string };
  leave(roomCode: string): void;
  disconnect(close?: boolean): void;
  emit(event: "session:terminated", payload: { roomCode: string; playerId: string; reason: "left" | "kicked"; message: string }): void;
  id: string;
}) {
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
    return room.selectedGameId ? gameRegistry.getAvailableGame(room.selectedGameId, room.language) : undefined;
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
          const en = normalizeRoomLanguage(payload.language) === "en";
          const maxRoomCount = roomCleanupService.getMaxRoomCount();
          ack(ackError(
            en
              ? `The server already has ${maxRoomCount} active rooms. Please try again later.`
              : `Der Server hat bereits ${maxRoomCount} aktive Räume. Bitte versuche es später erneut.`
          ));
          return;
        }
      }

      const room = requestedRoomCode && !createLocalPrimaryRoom
        ? existingRoom
        : roomManager.createRoom(hostName, normalizeRoomLanguage(payload.language));

      if (!room) {
        ack(ackError("Raumcode nicht gefunden."));
        return;
      }

      const previousHostSocketId = roomManager.attachHostSocket(room, socket.id, hostName);

      if (previousHostSocketId) {
        const previousHostSocket = io.sockets.sockets.get(previousHostSocketId);

        if (previousHostSocket) {
          previousHostSocket.leave(room.code);
          delete previousHostSocket.data.role;
          delete previousHostSocket.data.roomCode;
          delete previousHostSocket.data.playerId;
        }
      }

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
        stateBroadcaster.broadcastGameState(room);
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

      roomManager.setLanguage(room, normalizeRoomLanguage(payload.language, room.language));

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
      const extendText = socketText(normalizeRoomLanguage(room?.language));

      if (!hostedMode) {
        ack(
          ackError(
            room?.language === "ar"
              ? "Room lifetime extension is only available on the hosted server."
              : room?.language === "en"
                ? "Room lifetime extension is only available on the hosted server."
                : "Die Raumverlaengerung ist nur auf dem gehosteten Server verfuegbar."
          )
        );
        return;
      }

      if (!room) {
        ack(ackError(extendText.roomNotFound));
        return;
      }

      if (socket.data.role !== "host" || socket.data.roomCode !== room.code || room.hostSocketId !== socket.id) {
        ack(
          ackError(
            room.language === "ar"
              ? "Only the host can extend the room."
              : room.language === "en"
                ? "Only the host can extend the room."
                : "Nur der Host kann den Raum verlaengern."
          )
        );
        return;
      }

      if (room.expiresAt === null || room.expiresAt <= now()) {
        ack(
          ackError(
            room.language === "ar"
              ? "This room is already expired."
              : room.language === "en"
                ? "This room is already expired."
                : "Dieser Raum ist bereits abgelaufen."
          )
        );
        return;
      }

      if (room.expiresAt - now() > ROOM_EXTENSION_WINDOW_MS) {
        ack(
          ackError(
            room.language === "ar"
              ? "Room extension is available during the final five minutes only."
              : room.language === "en"
                ? "Room extension is available during the final five minutes only."
                : "Die Raumverlaengerung ist erst in den letzten fuenf Minuten moeglich."
          )
        );
        return;
      }

      roomCleanupService.extendRoomLifetime(room);
      stateBroadcaster.broadcastRoomState(room);
      ack({ ok: true, data: { room: stateBroadcaster.createRoomSnapshot(room) } });
    });

    on("room:join", (payload, ack) => {
      const room = roomManager.getRoom(payload.roomCode);

      if (!room) {
        ack(ackError("Raumcode nicht gefunden."));
        return;
      }
      const text = socketText(room.language);

      const playerName = payload.playerName.trim();

      if (!playerName) {
        ack(ackError(text.enterPlayerName));
        return;
      }

      const result = playerManager.joinPlayer(room, payload, socket.id);
      const player = result.player;
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
        ack(ackError("Session nicht gefunden."));
        return;
      }

      const room = roomManager.getRoom(session.roomCode);

      if (!room) {
        ack(ackError("Raum zur Session existiert nicht mehr."));
        return;
      }
      const text = socketText(room.language);

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
        stateBroadcaster.broadcastRoomState(room);
        stateBroadcaster.broadcastGameState(room);
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
