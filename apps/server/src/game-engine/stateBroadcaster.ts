import type {
  LightTrailsHostPatch,
  LightTrailsState,
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

const playingHostStateIntervalMs = 33;
const chaosKommandoControllerStateIntervalMs = 100;

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

  private readonly lightTrailsHostCache = new Map<
    string,
    {
      roundNumber: number;
      phase: string;
      tick: number;
      segmentCountsByPlayerId: Map<string, number>;
    }
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

  clearGameStateCache(roomCode: string): void {
    this.lightTrailsHostCache.delete(roomCode);
    this.lastHostEmitAtByRoom.delete(roomCode);
    this.lastControllerEmitAtByRoom.delete(roomCode);
  }

  broadcastGameState(room: RoomRecord): void {
    const totalStart = performance.now();
    const hostStateStart = performance.now();
    const hostGameState = this.gameRuntime.getPublicGameState(room, "host");
    const hostStateMs = performance.now() - hostStateStart;
    const controllerStateStart = performance.now();
    const sharedControllerGameState = this.gameRuntime.getPublicGameState(room, "controller");
    const controllerStateMs = performance.now() - controllerStateStart;

    if (!hostGameState || !sharedControllerGameState) {
      return;
    }

    const socketIds = this.io.sockets.adapter.rooms.get(room.code);

    if (!socketIds) {
      return;
    }

    let hostRecipients = 0;
    let controllerRecipients = 0;
    let controllerSuppressedRecipients = 0;
    let hostPatchRecipients = 0;
    let hostSuppressedRecipients = 0;
    const shouldEmitHostState = this.shouldEmitHostState(room.code, hostGameState, totalStart);
    const shouldEmitControllerState = this.shouldEmitControllerState(room.code, sharedControllerGameState, totalStart);
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

        const patchPayload = this.buildHostPatchPayload(room, hostGameState);

        if (patchPayload) {
          hostPatchRecipients += 1;
          socket.compress(false).emit("game:patch", patchPayload);
          continue;
        }

        const hostEmitter = socket.compress(false);
        const hostPayload = {
          roomCode: room.code,
          game: hostGameState
        };
        const shouldUseVolatileHostStream =
          hostGameState.phase === "playing" || hostGameState.phase === "locked";

        if (shouldUseVolatileHostStream) {
          hostEmitter.volatile.emit("game:state", hostPayload);
        } else {
          hostEmitter.emit("game:state", hostPayload);
        }

        this.rememberHostState(room, hostGameState);
        continue;
      }

      controllerRecipients += 1;

      if (!shouldEmitControllerState) {
        controllerSuppressedRecipients += 1;
        continue;
      }

      const controllerGameState = socket.data.playerId
        ? this.gameRuntime.getControllerGameStateForPlayer(room, socket.data.playerId)
        : sharedControllerGameState;

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
      `broadcaster:${room.currentRound?.gameId ?? room.selectedGameId ?? "unknown"}`,
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
          hostSuppressedRecipients
          ,
          controllerSuppressedRecipients
        },
        tags: {
          roomCode: room.code,
          gameId: room.currentRound?.gameId ?? room.selectedGameId ?? null,
          phase: room.currentRound?.phase ?? null
        },
        flags: {
          hasPatchRecipients: hostPatchRecipients > 0,
          hostThrottled: hostSuppressedRecipients > 0,
          controllerThrottled: controllerSuppressedRecipients > 0
        }
      }
    );
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

  private buildHostPatchPayload(
    room: RoomRecord,
    hostGameState: NonNullable<ReturnType<GameRuntime["getPublicGameState"]>>
  ): GamePatchPayload<LightTrailsHostPatch> | null {
    if (hostGameState.gameId !== "light-trails" || hostGameState.phase !== "playing") {
      this.lightTrailsHostCache.delete(room.code);
      return null;
    }

    const currentState = hostGameState.state as LightTrailsState;
    const cache = this.lightTrailsHostCache.get(room.code);

    if (
      !cache ||
      cache.roundNumber !== hostGameState.roundNumber ||
      cache.phase !== hostGameState.phase ||
      currentState.tick <= cache.tick
    ) {
      return null;
    }

    const players = Object.fromEntries(
      Object.values(currentState.players).map((player) => {
        const startIndex = cache.segmentCountsByPlayerId.get(player.playerId) ?? 0;

        return [
          player.playerId,
          {
            playerId: player.playerId,
            name: player.name,
            color: player.color,
            x: player.x,
            y: player.y,
            angleRad: player.angleRad,
            alive: player.alive,
            turnInput: player.turnInput,
            trailSegments: player.trailSegments.slice(startIndex),
            eliminatedAt: player.eliminatedAt,
            collisionReason: player.collisionReason
          }
        ];
      })
    );

    const payload: GamePatchPayload<LightTrailsHostPatch> = {
      roomCode: room.code,
      gameId: hostGameState.gameId,
      roundNumber: hostGameState.roundNumber,
      phase: hostGameState.phase,
      updatedAt: hostGameState.updatedAt,
      message: hostGameState.message,
      patch: {
        arenaWidth: currentState.arenaWidth,
        arenaHeight: currentState.arenaHeight,
        cellSize: currentState.cellSize,
        trailThickness: currentState.trailThickness,
        tick: currentState.tick,
        alivePlayerIds: currentState.alivePlayerIds,
        winnerPlayerId: currentState.winnerPlayerId,
        winnerName: currentState.winnerName,
        isDraw: currentState.isDraw,
        finishAt: currentState.finishAt,
        players
      }
    };

    this.rememberHostState(room, hostGameState);
    return payload;
  }

  private rememberHostState(
    room: RoomRecord,
    hostGameState: NonNullable<ReturnType<GameRuntime["getPublicGameState"]>>
  ): void {
    if (hostGameState.gameId !== "light-trails" || hostGameState.phase !== "playing") {
      this.lightTrailsHostCache.delete(room.code);
      return;
    }

    const currentState = hostGameState.state as LightTrailsState;

    this.lightTrailsHostCache.set(room.code, {
      roundNumber: hostGameState.roundNumber,
      phase: hostGameState.phase,
      tick: currentState.tick,
      segmentCountsByPlayerId: new Map(
        Object.values(currentState.players).map((player) => [player.playerId, player.trailSegments.length])
      )
    });
  }

  private shouldEmitHostState(
    roomCode: string,
    hostGameState: NonNullable<ReturnType<GameRuntime["getPublicGameState"]>>,
    nowMs: number
  ): boolean {
    if (hostGameState.phase !== "playing" && hostGameState.phase !== "locked") {
      this.lastHostEmitAtByRoom.delete(roomCode);
      return true;
    }

    const lastEmittedAtMs = this.lastHostEmitAtByRoom.get(roomCode) ?? Number.NEGATIVE_INFINITY;

    if (nowMs - lastEmittedAtMs < playingHostStateIntervalMs) {
      return false;
    }

    this.lastHostEmitAtByRoom.set(roomCode, nowMs);
    return true;
  }

  private shouldEmitControllerState(
    roomCode: string,
    controllerGameState: NonNullable<ReturnType<GameRuntime["getPublicGameState"]>>,
    nowMs: number
  ): boolean {
    const isChaosKommando = controllerGameState.gameId === "chaos-kommando";
    const isLivePhase =
      controllerGameState.phase === "playing" || controllerGameState.phase === "locked";

    if (!isChaosKommando || !isLivePhase) {
      this.lastControllerEmitAtByRoom.delete(roomCode);
      return true;
    }

    const lastEmittedAtMs = this.lastControllerEmitAtByRoom.get(roomCode) ?? Number.NEGATIVE_INFINITY;

    if (nowMs - lastEmittedAtMs < chaosKommandoControllerStateIntervalMs) {
      return false;
    }

    this.lastControllerEmitAtByRoom.set(roomCode, nowMs);
    return true;
  }
}
