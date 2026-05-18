import type {
  ClientToServerEvents,
  GameStateEnvelope,
  PlayerSnapshot,
  RoomSnapshot,
  ScoreboardSnapshot,
  ServerToClientEvents,
  SupportedLanguage
} from "@open-party-lab/protocol";
import { io, type Socket } from "socket.io-client";
import {
  readStoredControllerLanguage,
  writeStoredControllerLanguage
} from "../i18n/controllerText.js";
import {
  clearStoredControllerIdentity,
  getOrCreateDeviceId,
  loadReconnectToken,
  loadStoredSession,
  rotateDeviceId,
  saveStoredSession,
  type StoredControllerSession
} from "./deviceSession.js";

export interface ControllerAppState {
  connected: boolean;
  room: RoomSnapshot | null;
  player: PlayerSnapshot | null;
  game: GameStateEnvelope | null;
  scoreboard: ScoreboardSnapshot | null;
  error: string | null;
  preferredLanguage: SupportedLanguage;
  hasStoredSession: boolean;
  storedSession: StoredControllerSession | null;
}

type ControllerStateListener = (state: ControllerAppState) => void;

const initialState: ControllerAppState = {
  connected: false,
  room: null,
  player: null,
  game: null,
  scoreboard: null,
  error: null,
  preferredLanguage: readStoredControllerLanguage(),
  hasStoredSession: false,
  storedSession: null
};

function shouldUseVolatileInput(input: unknown): boolean {
  if (!input || typeof input !== "object") {
    return false;
  }

  const inputType = (input as { type?: unknown }).type;
  return inputType === "move" || inputType === "turn" || inputType === "aim";
}

export class ControllerSocketClient {
  private readonly socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private readonly listeners = new Set<ControllerStateListener>();
  private state: ControllerAppState = {
    ...initialState,
    hasStoredSession: Boolean(loadStoredSession()),
    storedSession: loadStoredSession()
  };
  private listenersBound = false;
  private notifyScheduled = false;
  private sessionTerminated = false;
  private sessionTerminationPending = false;

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
      const storedSession = loadStoredSession();
      this.updateState({
        connected: true,
        error: null,
        hasStoredSession: Boolean(storedSession),
        storedSession
      });
    });

    this.socket.on("disconnect", () => {
      this.updateState({ connected: false });
    });

    this.socket.on("connect_error", (error) => {
      this.updateState({
        connected: false,
        error:
          this.state.preferredLanguage === "en"
            ? `Connection to server failed: ${error.message}`
            : `Verbindung zum Server fehlgeschlagen: ${error.message}`
      });
    });

    this.socket.on("room:state", ({ room }) => {
      if (this.sessionTerminated || this.sessionTerminationPending) {
        return;
      }

      const playerId = this.state.player?.id ?? this.state.storedSession?.playerId;
      const player = playerId
        ? room.players.find((entry) => entry.id === playerId) ?? this.state.player
        : this.state.player;

      writeStoredControllerLanguage(room.language);
      this.updateState({
        room,
        preferredLanguage: room.language,
        player: player ?? null,
        game: room.currentRound ? this.state.game : null
      });
    });

    this.socket.on("game:state", ({ game }) => {
      if (this.sessionTerminated || this.sessionTerminationPending) {
        return;
      }

      this.updateState({ game });
    });

    this.socket.on("scoreboard:state", (scoreboard) => {
      if (this.sessionTerminated || this.sessionTerminationPending) {
        return;
      }

      this.updateState({ scoreboard });
    });

    this.socket.on("room:error", ({ message }) => {
      if (this.sessionTerminated || this.sessionTerminationPending) {
        return;
      }

      this.updateState({ error: message });
    });

    this.socket.on("session:resumed", ({ room, player, reconnectToken }) => {
      this.sessionTerminated = false;
      this.sessionTerminationPending = false;
      const storedSession = this.persistSession(room.code, player.id, player.name, reconnectToken);
      writeStoredControllerLanguage(room.language);
      this.updateState({
        room,
        player,
        preferredLanguage: room.language,
        hasStoredSession: true,
        storedSession
      });
    });

    this.socket.on("session:terminated", ({ message }) => {
      this.clearStoredSession({
        rotateDeviceId: true,
        disconnect: true,
        error: message
      });
    });

    this.socket.connect();
  }

  subscribe(listener: ControllerStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): ControllerAppState {
    return this.state;
  }

  joinRoom(roomCode: string, playerName: string): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }

    this.sessionTerminated = false;
    this.sessionTerminationPending = false;

    this.socket.emit(
      "room:join",
      {
        roomCode: roomCode.toUpperCase(),
        playerName,
        deviceId: getOrCreateDeviceId()
      },
      (result) => {
        if (!result.ok) {
          this.updateState({ error: result.error });
          return;
        }

        const storedSession = this.persistSession(
          result.data.room.code,
          result.data.player.id,
          result.data.player.name,
          result.data.reconnectToken
        );
        this.updateState({
          room: result.data.room,
          player: result.data.player,
          preferredLanguage: result.data.room.language,
          hasStoredSession: true,
          storedSession,
          error: null
        });
        writeStoredControllerLanguage(result.data.room.language);
      }
    );
  }

  resumeSession(): void {
    const reconnectToken = loadReconnectToken();

    if (!reconnectToken) {
      this.updateState({
        error:
          this.state.preferredLanguage === "en"
            ? "No saved session found."
            : "Keine gespeicherte Session gefunden.",
        hasStoredSession: false
      });
      return;
    }

    if (!this.socket.connected) {
      this.socket.connect();
    }

    this.sessionTerminated = false;
    this.sessionTerminationPending = false;

    this.socket.emit(
      "session:resume",
      {
        reconnectToken,
        deviceId: getOrCreateDeviceId()
      },
      (result) => {
        if (!result.ok) {
          this.sessionTerminated = true;
          this.sessionTerminationPending = false;
          clearStoredControllerIdentity();
          this.updateState({
            error: result.error,
            hasStoredSession: false,
            storedSession: null,
            player: null,
            room: null,
            game: null,
            scoreboard: null
          });
          return;
        }

        const storedSession = this.persistSession(
          result.data.room.code,
          result.data.player.id,
          result.data.player.name,
          result.data.reconnectToken
        );
        this.updateState({
          room: result.data.room,
          player: result.data.player,
          preferredLanguage: result.data.room.language,
          hasStoredSession: true,
          storedSession,
          error: null
        });
        writeStoredControllerLanguage(result.data.room.language);
      }
    );
  }

  leaveRoom(): void {
    if (!this.state.room || !this.state.player) {
      return;
    }

    if (!this.socket.connected) {
      this.socket.connect();
    }

    this.sessionTerminationPending = true;

    this.socket.emit(
      "room:leave",
      {
        roomCode: this.state.room.code
      },
      (result) => {
        if (!result.ok) {
          this.sessionTerminationPending = false;
          this.updateState({ error: result.error });
          return;
        }

        this.clearStoredSession({
          rotateDeviceId: true,
          disconnect: true,
          error:
            this.state.preferredLanguage === "en"
              ? "You left the room."
              : "Du hast den Raum verlassen."
        });
      }
    );
  }

  clearStoredSession(options?: {
    rotateDeviceId?: boolean;
    disconnect?: boolean;
    error?: string | null;
  }): void {
    this.sessionTerminated = true;
    this.sessionTerminationPending = false;

    clearStoredControllerIdentity();

    if (options?.rotateDeviceId) {
      rotateDeviceId();
    }

    this.updateState({
      hasStoredSession: false,
      storedSession: null,
      player: null,
      room: null,
      game: null,
      scoreboard: null,
      error: options?.error ?? null
    });

    if (options?.disconnect !== false) {
      this.socket.disconnect();
    }
  }

  setReady(isReady: boolean): void {
    if (!this.state.room || !this.state.player) {
      return;
    }

    this.socket.emit("player:ready", {
      roomCode: this.state.room.code,
      playerId: this.state.player.id,
      isReady
    });
  }

  selectCharacter(characterId: string): void {
    if (!this.state.room || !this.state.player) {
      return;
    }

    this.socket.emit("player:select-character", {
      roomCode: this.state.room.code,
      playerId: this.state.player.id,
      characterId
    });
  }

  sendInput(input: unknown): void {
    if (!this.state.room || !this.state.player) {
      return;
    }

    const emitter = shouldUseVolatileInput(input) ? this.socket.volatile : this.socket;

    emitter.emit("game:input", {
      roomCode: this.state.room.code,
      playerId: this.state.player.id,
      input
    });
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

  private updateState(patch: Partial<ControllerAppState>): void {
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

  private persistSession(
    roomCode: string,
    playerId: string,
    playerName: string,
    reconnectToken: string
  ): StoredControllerSession {
    const session = {
      reconnectToken,
      roomCode,
      playerId,
      playerName,
      savedAt: Date.now()
    };

    saveStoredSession(session);
    return session;
  }
}
