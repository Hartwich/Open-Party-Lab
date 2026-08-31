import type {
  AvailableGameDto,
  GamePatchPayload,
  GameStateEnvelope,
  RoomSnapshot,
  ScoreboardSnapshot,
  ServerToClientEvents,
  ClientToServerEvents,
  SupportedLanguage
} from "@open-party-lab/protocol";
import { io, type Socket } from "socket.io-client";
import { hasActiveRound } from "@open-party-lab/protocol";
import { readStoredHostLanguage, writeStoredHostLanguage } from "../i18n/hostText.js";
import { hostGameRegistry } from "../games/registry.js";
import { applyHostTheme } from "../ui/theme/theme.js";

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
  /** Set when a room update switched the theme, so scenes force a redraw. */
  private themeChanged = false;

  constructor(
    private readonly serverUrl: string,
    private readonly requestedRoomCode: string | null = null
  ) {
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
      // The theme is a room setting; adopting it here keeps every scene and
      // overlay in step without each of them subscribing separately.
      this.themeChanged = applyHostTheme(room.theme) || this.themeChanged;
      this.updateState({
        room,
        preferredLanguage: room.language,
        game: room.currentRound ? this.state.game : null,
        preferredLobbyScreen: resolvePreferredLobbyScreen(
          room,
          this.state.preferredLobbyScreen
        ),
        // The catalog override is a local view preference. A round that is
        // running always wins — otherwise the screen stays on the catalog when
        // a phone with host control starts the round.
        sceneOverride: room && !hasActiveRound(room) ? this.state.sceneOverride : null
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

    this.socket.on("room:closed", ({ reason, message }) => {
      this.updateState({ room: null, game: null, scoreboard: null, error: message });

      if (import.meta.env.VITE_OPEN_PARTY_LAB_HOSTED === "1") {
        window.location.replace(`/?closed=${encodeURIComponent(reason)}`);
      }
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

  /**
   * Whether the last update changed the theme. Reading it clears the flag, so
   * the first scene to ask is the one that forces the redraw.
   */
  consumeThemeChange(): boolean {
    const changed = this.themeChanged;
    this.themeChanged = false;
    return changed;
  }

  /** Host action: switch the room's theme. */
  setTheme(theme: string): void {
    const roomCode = this.state.room?.code;

    if (!roomCode) {
      return;
    }

    this.socket.emit("room:set-theme", { roomCode, theme: theme as never }, (result) => {
      if (!result.ok) {
        this.updateState({ error: result.error });
        return;
      }

      applyHostTheme(result.data.room.theme);
      this.themeChanged = true;
      this.updateState({ room: result.data.room, error: null });
    });
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

  /**
   * Answers a pending takeover request from a phone.
   *
   * Only the shared screen may do this; the server enforces it, this is just
   * the wire call.
   */
  resolveHostControl(playerId: string, grant: boolean): void {
    const roomCode = this.state.room?.code;

    if (!roomCode) {
      return;
    }

    this.socket.emit("host-control:resolve", { roomCode, playerId, grant }, (result) => {
      if (!result.ok) {
        this.updateState({ error: result.error });
        return;
      }

      this.updateState({ room: result.data.room, error: null });
    });
  }

  /** Takes the controls back from whoever is holding them. */
  reclaimHostControl(): void {
    const roomCode = this.state.room?.code;

    if (!roomCode) {
      return;
    }

    this.socket.emit("host-control:release", { roomCode }, (result) => {
      if (!result.ok) {
        this.updateState({ error: result.error });
        return;
      }

      this.updateState({ room: result.data.room, error: null });
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
      this.socket.emit("game:select", { roomCode: nextRoom.code, gameId: null });
      this.updateState({
        room: {
          ...nextRoom,
          selectedGameId: null,
          currentRound: null
        },
        game: null,
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
    this.socket.emit("room:create", {
      hostName: "Host Screen",
      language: this.state.preferredLanguage,
      roomCode: this.requestedRoomCode ?? undefined
    }, (result) => {
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

/**
 * Merges an incremental patch into the state the host already holds.
 *
 * The merge itself belongs to the game — the host only checks that the patch
 * still matches the round it is rendering, then delegates. Returning null makes
 * the host discard the patch and wait for the next full state, which is the
 * safe behaviour whenever anything is out of step.
 */
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

  const merge = hostGameRegistry[payload.gameId]?.applyHostPatch;

  if (!merge) {
    return null;
  }

  const mergedState = merge(currentGame.state, payload.patch);

  if (mergedState === null || mergedState === undefined) {
    return null;
  }

  return {
    ...currentGame,
    updatedAt: payload.updatedAt,
    message: payload.message,
    state: mergedState
  };
}
