import type {
  LightTrailsHostPatch,
  AvailableGameDto,
  LightTrailsState,
  GamePatchPayload,
  GameStateEnvelope,
  RoomSnapshot,
  ScoreboardSnapshot,
  ServerToClientEvents,
  ClientToServerEvents,
  SupportedLanguage
} from "@open-party-lab/protocol";
import { io, type Socket } from "socket.io-client";
import { readStoredHostLanguage, writeStoredHostLanguage } from "../i18n/hostText.js";

export type HostLobbyScreen = "catalog" | null;
export type HostSceneOverride = "catalog" | null;

export interface HostAppState {
  connected: boolean;
  room: RoomSnapshot | null;
  game: GameStateEnvelope | null;
  scoreboard: ScoreboardSnapshot | null;
  error: string | null;
  preferredLanguage: SupportedLanguage;
  preferredLobbyScreen: HostLobbyScreen;
  sceneOverride: HostSceneOverride;
}

type HostStateListener = (state: HostAppState) => void;

const initialState: HostAppState = {
  connected: false,
  room: null,
  game: null,
  scoreboard: null,
  error: null,
  preferredLanguage: readStoredHostLanguage(),
  preferredLobbyScreen: null,
  sceneOverride: null
};

function resolvePreferredLobbyScreen(
  room: RoomSnapshot | null,
  currentPreference: HostLobbyScreen
): HostLobbyScreen {
  if (!room || room.currentRound) {
    return currentPreference === "catalog" ? "catalog" : null;
  }

  return "catalog";
}

export class HostSocketClient {
  private readonly listeners = new Set<HostStateListener>();
  private readonly socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private state: HostAppState = initialState;
  private roomRequested = false;
  private listenersBound = false;
  private notifyScheduled = false;

  constructor(private readonly serverUrl: string) {
    this.socket = io(serverUrl, {
      autoConnect: false,
      timeout: 5_000
    });
  }

  connect(): void {
    if (this.listenersBound) {
      this.socket.connect();
      return;
    }

    this.listenersBound = true;
    this.socket.on("connect", () => {
      this.updateState({ connected: true, error: null });
      this.requestHostRoom();
    });

    this.socket.on("disconnect", () => {
      this.updateState({ connected: false });
    });

    this.socket.on("connect_error", (error) => {
      this.updateState({
        connected: false,
        error: `Verbindung zum Server fehlgeschlagen: ${error.message}`
      });
    });

    this.socket.on("room:state", ({ room }) => {
      writeStoredHostLanguage(room.language);
      this.updateState({
        room,
        preferredLanguage: room.language,
        game: room.currentRound ? this.state.game : null,
        preferredLobbyScreen: resolvePreferredLobbyScreen(
          room,
          this.state.preferredLobbyScreen
        ),
        sceneOverride: room ? this.state.sceneOverride : null
      });
    });

    this.socket.on("game:state", ({ game }) => {
      this.updateState({ game });
    });

    this.socket.on("game:patch", (payload) => {
      const nextGame = applyGamePatch(this.state.game, payload);

      if (nextGame) {
        this.updateState({ game: nextGame });
      }
    });

    this.socket.on("scoreboard:state", (scoreboard) => {
      this.updateState({ scoreboard });
    });

    this.socket.on("room:error", ({ message }) => {
      this.updateState({ error: message });
    });

    this.socket.connect();
  }

  subscribe(listener: HostStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): HostAppState {
    return this.state;
  }

  selectGame(gameId: string): void {
    const roomCode = this.state.room?.code;

    if (!roomCode) {
      return;
    }

    this.updateState({
      sceneOverride: null,
      preferredLobbyScreen: "catalog",
      error: null
    });
    this.socket.emit("game:select", { roomCode, gameId });
  }

  sendGameHostAction(gameId: string, action: unknown): void {
    const roomCode = this.state.room?.code;

    if (!roomCode) {
      return;
    }

    this.socket.emit("game:host-action", { roomCode, gameId, action });
  }

  setLanguage(language: SupportedLanguage): void {
    writeStoredHostLanguage(language);
    this.updateState({ preferredLanguage: language });

    const roomCode = this.state.room?.code;

    if (!roomCode) {
      return;
    }

    this.socket.emit("room:set-language", { roomCode, language }, (result) => {
      if (!result.ok) {
        this.updateState({ error: result.error });
        return;
      }

      writeStoredHostLanguage(result.data.room.language);
      this.updateState({
        room: result.data.room,
        preferredLanguage: result.data.room.language,
        error: null
      });
    });
  }

  kickPlayer(playerId: string): void {
    const roomCode = this.state.room?.code;

    if (!roomCode) {
      return;
    }

    this.socket.emit("player:kick", { roomCode, playerId }, (result) => {
      if (!result.ok) {
        this.updateState({ error: result.error });
        return;
      }

      this.updateState({
        room: result.data.room,
        error: null
      });
    });
  }

  startRound(): void {
    const room = this.state.room;
    const roomCode = room?.code;

    if (!roomCode) {
      return;
    }

    const selectedGame = this.getSelectedGame();

    if (selectedGame?.roundCompletionMode === "wait_for_ready") {
      this.updateState({ sceneOverride: null });
      return;
    }

    this.updateState({ sceneOverride: null });
    this.socket.emit("round:start", { roomCode });
  }

  async savePerfLog(payload: unknown): Promise<{ ok: boolean; file?: string; error?: string }> {
    try {
      const response = await fetch(new URL("/debug/perf-log", this.serverUrl), {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as { file?: string; error?: string };

      if (!response.ok) {
        return {
          ok: false,
          error: result.error ?? `HTTP ${response.status}`
        };
      }

      return {
        ok: true,
        file: result.file
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unbekannter Fehler"
      };
    }
  }

  returnToGameSelection(): void {
    const room = this.state.room;

    if (!room) {
      return;
    }

    const showCatalog = (nextRoom = room) => {
      this.updateState({
        room: nextRoom,
        game: nextRoom.currentRound ? this.state.game : null,
        sceneOverride: "catalog",
        preferredLobbyScreen: "catalog",
        error: null
      });
    };

    if (room.currentRound && room.currentRound.phase !== "finished") {
      this.socket.emit("round:abort", { roomCode: room.code }, (result) => {
        if (!result.ok) {
          this.updateState({ error: result.error });
          return;
        }

        showCatalog(result.data.room);
      });
      return;
    }

    showCatalog();
  }

  private updateState(patch: Partial<HostAppState>): void {
    this.state = { ...this.state, ...patch };

    this.scheduleNotifyListeners();
  }

  private scheduleNotifyListeners(): void {
    if (this.notifyScheduled) {
      return;
    }

    this.notifyScheduled = true;

    const flush = () => {
      this.notifyScheduled = false;

      for (const listener of this.listeners) {
        listener(this.state);
      }
    };

    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(flush);
      return;
    }

    setTimeout(flush, 0);
  }

  private requestHostRoom(): void {
    if (this.roomRequested) {
      return;
    }

    this.roomRequested = true;
    this.socket.emit("room:create", { hostName: "Host Screen", language: this.state.preferredLanguage }, (result) => {
      this.roomRequested = false;

      if (!result.ok) {
        this.updateState({ error: result.error });
        return;
      }

      writeStoredHostLanguage(result.data.room.language);
      this.updateState({
        room: result.data.room,
        preferredLanguage: result.data.room.language,
        error: null
      });
    });
  }

  private getSelectedGame(): AvailableGameDto | undefined {
    const room = this.state.room;

    if (!room?.selectedGameId) {
      return undefined;
    }

    return room.availableGames.find((game) => game.id === room.selectedGameId);
  }
}

function applyGamePatch(
  currentGame: GameStateEnvelope | null,
  payload: GamePatchPayload
): GameStateEnvelope | null {
  if (!currentGame || payload.replace) {
    return null;
  }

  if (
    payload.gameId !== currentGame.gameId ||
    payload.roundNumber !== currentGame.roundNumber ||
    payload.phase !== currentGame.phase
  ) {
    return null;
  }

  if (payload.gameId !== "light-trails") {
    return null;
  }

  const currentState = currentGame.state as LightTrailsState;
  const patch = payload.patch as LightTrailsHostPatch;

  for (const [playerId, playerPatch] of Object.entries(patch.players)) {
    const existingPlayer = currentState.players[playerId];

    if (!existingPlayer) {
      currentState.players[playerId] = {
        playerId: playerPatch.playerId,
        name: playerPatch.name,
        color: playerPatch.color,
        x: playerPatch.x,
        y: playerPatch.y,
        angleRad: playerPatch.angleRad,
        alive: playerPatch.alive,
        turnInput: playerPatch.turnInput,
        trailCellIds: [],
        trailSegments: [...playerPatch.trailSegments],
        eliminatedAt: playerPatch.eliminatedAt,
        collisionReason: playerPatch.collisionReason
      };
      continue;
    }

    existingPlayer.x = playerPatch.x;
    existingPlayer.y = playerPatch.y;
    existingPlayer.angleRad = playerPatch.angleRad;
    existingPlayer.alive = playerPatch.alive;
    existingPlayer.turnInput = playerPatch.turnInput;
    existingPlayer.eliminatedAt = playerPatch.eliminatedAt;
    existingPlayer.collisionReason = playerPatch.collisionReason;

    if (playerPatch.trailSegments.length > 0) {
      existingPlayer.trailSegments.push(...playerPatch.trailSegments);
    }
  }

  currentState.arenaWidth = patch.arenaWidth;
  currentState.arenaHeight = patch.arenaHeight;
  currentState.cellSize = patch.cellSize;
  currentState.trailThickness = patch.trailThickness;
  currentState.tick = patch.tick;
  currentState.alivePlayerIds = patch.alivePlayerIds;
  currentState.winnerPlayerId = patch.winnerPlayerId;
  currentState.winnerName = patch.winnerName;
  currentState.isDraw = patch.isDraw;
  currentState.finishAt = patch.finishAt;

  return {
    ...currentGame,
    updatedAt: payload.updatedAt,
    message: payload.message,
    state: currentState
  };
}
