import type {
  ClientToServerEvents,
  GamePatchPayload,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from "@open-party-lab/protocol";
import type { Socket } from "socket.io";
import type { Server } from "socket.io";
import { performance } from "node:perf_hooks";
import { serverPerfRegistry } from "../core/perf/serverPerfRegistry.js";
import { toRoomSnapshot } from "../rooms/roomLifecycle.js";
import type { RoomRecord } from "../rooms/roomStore.js";
import { GameRegistry } from "./gameRegistry.js";
import { GameRuntime } from "./gameRuntime.js";
import { ScoreManager } from "./scoreManager.js";

/** Default cadence while a round is live; games may raise it in their manifest. */
const defaultHostStateIntervalMs = 33;
const defaultControllerStateIntervalMs = 0;

export class StateBroadcaster {
  constructor(
    private readonly io: Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    private readonly gameRegistry: GameRegistry,
    private readonly gameRuntime: GameRuntime,
    private readonly scoreManager: ScoreManager
  ) {}

  /**
   * Last public host state emitted per room, so games that support patches can
   * diff against exactly what the host already has.
   */
  private readonly lastHostStateByRoom = new Map<
    string,
    { roundNumber: number; phase: string; state: unknown }
  >();
  private readonly lastHostEmitAtByRoom = new Map<string, number>();
  private readonly lastControllerEmitAtByRoom = new Map<string, number>();

  createRoomSnapshot(room: RoomRecord) {
    return toRoomSnapshot(room, this.gameRegistry.listAvailableGames(room.language));
  }

  sendRoomState(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    room: RoomRecord
  ): void {
    socket.emit("room:state", { room: this.createRoomSnapshot(room) });
  }

  broadcastRoomState(room: RoomRecord): void {
    this.io.to(room.code).emit("room:state", { room: this.createRoomSnapshot(room) });
  }

  sendControllerGameState(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    room: RoomRecord
  ): void {
    if (socket.data.role !== "controller") {
      return;
    }

    const controllerGameState = socket.data.playerId
      ? this.gameRuntime.getControllerGameStateForPlayer(room, socket.data.playerId)
      : this.gameRuntime.getPublicGameState(room, "controller");

    if (!controllerGameState) {
      return;
    }

    socket.compress(false).emit("game:state", {
      roomCode: room.code,
      game: controllerGameState
    });
  }

  clearGameStateCache(roomCode: string): void {
    this.lastHostStateByRoom.delete(roomCode);
    this.lastHostEmitAtByRoom.delete(roomCode);
    this.lastControllerEmitAtByRoom.delete(roomCode);
  }

  broadcastGameState(room: RoomRecord): void {
    const totalStart = performance.now();
    const round = room.currentRound;

    if (!round) {
      return;
    }

    const socketIds = this.io.sockets.adapter.rooms.get(room.code);

    if (!socketIds) {
      return;
    }

    // Decide who is due before building anything. Building the public states
    // walks every entity of the round; doing it for an emit the throttle is
    // about to drop was the bulk of the cost of input-triggered broadcasts.
    const shouldEmitHostState = this.shouldEmitHostState(room.code, round.gameId, round.phase, totalStart);
    const shouldEmitControllerState = this.shouldEmitControllerState(
      room.code,
      round.gameId,
      round.phase,
      totalStart
    );
    let hostStateMs = 0;
    let controllerStateMs = 0;
    let hostGameState: ReturnType<GameRuntime["getPublicGameState"]> | undefined;
    let sharedControllerGameState: ReturnType<GameRuntime["getPublicGameState"]> | undefined;
    const resolveHostGameState = () => {
      if (hostGameState === undefined) {
        const start = performance.now();
        hostGameState = this.gameRuntime.getPublicGameState(room, "host");
        hostStateMs += performance.now() - start;
      }

      return hostGameState;
    };
    const resolveControllerGameState = (playerId: string | undefined) => {
      const start = performance.now();

      if (playerId) {
        const playerState = this.gameRuntime.getControllerGameStateForPlayer(room, playerId);
        controllerStateMs += performance.now() - start;
        return playerState;
      }

      if (sharedControllerGameState === undefined) {
        sharedControllerGameState = this.gameRuntime.getPublicGameState(room, "controller");
      }

      controllerStateMs += performance.now() - start;
      return sharedControllerGameState;
    };

    let hostRecipients = 0;
    let controllerRecipients = 0;
    let controllerSuppressedRecipients = 0;
    let hostPatchRecipients = 0;
    let hostSuppressedRecipients = 0;
    const emitLoopStart = performance.now();

    for (const socketId of socketIds) {
      const socket = this.io.sockets.sockets.get(socketId);

      if (!socket) {
        continue;
      }

      if (socket.data.role === "host") {
        hostRecipients += 1;

        if (!shouldEmitHostState) {
          hostSuppressedRecipients += 1;
          continue;
        }

        const currentHostGameState = resolveHostGameState();

        if (!currentHostGameState) {
          continue;
        }

        const patchPayload = this.buildHostPatchPayload(room, currentHostGameState);

        if (patchPayload) {
          hostPatchRecipients += 1;
          socket.compress(false).emit("game:patch", patchPayload);
          continue;
        }

        const hostEmitter = socket.compress(false);
        const hostPayload = {
          roomCode: room.code,
          game: currentHostGameState
        };
        const shouldUseVolatileHostStream =
          currentHostGameState.phase === "playing" || currentHostGameState.phase === "locked";

        if (shouldUseVolatileHostStream) {
          hostEmitter.volatile.emit("game:state", hostPayload);
        } else {
          hostEmitter.emit("game:state", hostPayload);
        }

        this.rememberHostState(room, currentHostGameState);
        continue;
      }

      controllerRecipients += 1;

      if (!shouldEmitControllerState) {
        controllerSuppressedRecipients += 1;
        continue;
      }

      const controllerGameState = resolveControllerGameState(socket.data.playerId);

      if (!controllerGameState) {
        continue;
      }

      const controllerEmitter = socket.compress(false);
      const shouldUseVolatileControllerStream =
        controllerGameState.phase === "playing" || controllerGameState.phase === "locked";

      if (shouldUseVolatileControllerStream) {
        controllerEmitter.volatile.emit("game:state", {
          roomCode: room.code,
          game: controllerGameState
        });
        continue;
      }

      controllerEmitter.emit("game:state", {
        roomCode: room.code,
        game: controllerGameState
      });
    }

    serverPerfRegistry.sample(
      `broadcaster:game:${room.code}`,
      `broadcaster:${round.gameId}`,
      {
        timingsMs: {
          total: performance.now() - totalStart,
          hostState: hostStateMs,
          controllerState: controllerStateMs,
          emitLoop: performance.now() - emitLoopStart
        },
        counters: {
          players: room.players.size,
          sockets: socketIds.size,
          hostRecipients,
          controllerRecipients,
          hostPatchRecipients,
          hostSuppressedRecipients,
          controllerSuppressedRecipients
        },
        tags: {
          roomCode: room.code,
          gameId: round.gameId,
          phase: round.phase
        },
        flags: {
          hasPatchRecipients: hostPatchRecipients > 0,
          hostThrottled: hostSuppressedRecipients > 0,
          controllerThrottled: controllerSuppressedRecipients > 0
        }
      }
    );
  }

  /**
   * Whether a state change caused by a player input can wait for the next tick.
   *
   * Only for games that opted in, have a tick to carry the change, and only
   * while playing: a phase change always goes out immediately.
   */
  canDeferInputBroadcast(room: RoomRecord, phaseChanged: boolean): boolean {
    const round = room.currentRound;

    if (!round || phaseChanged || round.phase !== "playing") {
      return false;
    }

    const entry = this.gameRegistry.get(round.gameId);

    return Boolean(entry?.serverGame.tick && entry.manifest.broadcast?.deferInputBroadcastToTick);
  }

  broadcastScoreboard(room: RoomRecord): void {
    this.io.to(room.code).emit("scoreboard:state", this.scoreManager.toSnapshot(room));
  }

  emitError(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    code: string,
    message: string
  ): void {
    socket.emit("room:error", { code, message });
  }

  /**
   * Asks the selected game for a delta against the last state we sent.
   *
   * Returns null whenever anything is out of step — different round, different
   * phase, no previous state, or the game declining — in which case the caller
   * falls back to a full state emit.
   */
  private buildHostPatchPayload(
    room: RoomRecord,
    hostGameState: NonNullable<ReturnType<GameRuntime["getPublicGameState"]>>
  ): GamePatchPayload | null {
    const entry = this.gameRegistry.get(hostGameState.gameId);

    if (
      !entry?.serverGame.buildHostPatch ||
      entry.manifest.broadcast?.supportsHostPatches !== true ||
      hostGameState.phase !== "playing"
    ) {
      return null;
    }

    const previous = this.lastHostStateByRoom.get(room.code);

    if (
      !previous ||
      previous.roundNumber !== hostGameState.roundNumber ||
      previous.phase !== hostGameState.phase
    ) {
      return null;
    }

    const patch = entry.serverGame.buildHostPatch(
      hostGameState.state as never,
      previous.state as never,
      this.gameRuntime.buildPublicContext(room)
    );

    if (patch === null || patch === undefined) {
      return null;
    }

    this.rememberHostState(room, hostGameState);

    return {
      roomCode: room.code,
      gameId: hostGameState.gameId,
      roundNumber: hostGameState.roundNumber,
      phase: hostGameState.phase,
      updatedAt: hostGameState.updatedAt,
      message: hostGameState.message,
      patch
    };
  }

  /** Remembers what the host now has, for the next diff. */
  private rememberHostState(
    room: RoomRecord,
    hostGameState: NonNullable<ReturnType<GameRuntime["getPublicGameState"]>>
  ): void {
    this.lastHostStateByRoom.set(room.code, {
      roundNumber: hostGameState.roundNumber,
      phase: hostGameState.phase,
      state: hostGameState.state
    });
  }

  /** Broadcast tuning the selected game asked for, if any. */
  private getBroadcastPolicy(gameId: string) {
    return this.gameRegistry.get(gameId)?.manifest.broadcast;
  }

  private shouldEmit(
    cache: Map<string, number>,
    roomCode: string,
    phase: string,
    nowMs: number,
    intervalMs: number
  ): boolean {
    const isLivePhase = phase === "playing" || phase === "locked";

    if (!isLivePhase || intervalMs <= 0) {
      cache.delete(roomCode);
      return true;
    }

    const lastEmittedAtMs = cache.get(roomCode) ?? Number.NEGATIVE_INFINITY;

    if (nowMs - lastEmittedAtMs < intervalMs) {
      return false;
    }

    cache.set(roomCode, nowMs);
    return true;
  }

  private shouldEmitHostState(
    roomCode: string,
    gameId: string,
    phase: string,
    nowMs: number
  ): boolean {
    const interval =
      this.getBroadcastPolicy(gameId)?.hostStateIntervalMs ??
      defaultHostStateIntervalMs;

    return this.shouldEmit(this.lastHostEmitAtByRoom, roomCode, phase, nowMs, interval);
  }

  private shouldEmitControllerState(
    roomCode: string,
    gameId: string,
    phase: string,
    nowMs: number
  ): boolean {
    const interval =
      this.getBroadcastPolicy(gameId)?.controllerStateIntervalMs ??
      defaultControllerStateIntervalMs;

    return this.shouldEmit(
      this.lastControllerEmitAtByRoom,
      roomCode,
      phase,
      nowMs,
      interval
    );
  }
}
