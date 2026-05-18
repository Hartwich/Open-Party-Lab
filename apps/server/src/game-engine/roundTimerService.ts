import type { RoomStore } from "../rooms/roomStore.js";
import { logger } from "../core/logger/logger.js";
import { performance } from "node:perf_hooks";
import { serverPerfRegistry } from "../core/perf/serverPerfRegistry.js";
import { GameRegistry } from "./gameRegistry.js";
import { GameRuntime } from "./gameRuntime.js";
import { StateBroadcaster } from "./stateBroadcaster.js";
import { PlayerManager } from "../players/playerManager.js";
import { canStartRound } from "../rooms/roomLifecycle.js";

export class RoundTimerService {
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    private readonly roomStore: RoomStore,
    private readonly playerManager: PlayerManager,
    private readonly gameRegistry: GameRegistry,
    private readonly gameRuntime: GameRuntime,
    private readonly stateBroadcaster: StateBroadcaster,
    private readonly tickMs: number
  ) {}

  start(): void {
    if (this.intervalHandle) {
      return;
    }

    this.intervalHandle = setInterval(() => {
      const cycleStart = performance.now();
      let roomCount = 0;
      let changedRooms = 0;
      let stateChangedRooms = 0;
      let scoreChangedRooms = 0;

      for (const room of this.roomStore.values()) {
        roomCount += 1;
        let roomChanged = this.playerManager.expireDisconnectedPlayers(room);
        let restartedReadyRound = false;

        const update = this.gameRuntime.tickRoom(room, this.tickMs);

        if (
          update?.phaseChanged &&
          room.currentRound?.phase === "finished"
        ) {
          const activeGame = this.gameRegistry.getAvailableGame(room.currentRound.gameId);

          if (activeGame?.roundCompletionMode === "wait_for_ready") {
            const roundState = room.currentRound.state as {
              result?: { outcome?: string };
            };
            const allowReadyCarry =
              activeGame.id === "arena-survivor" && roundState.result?.outcome === "survived";

            if (allowReadyCarry && canStartRound(room, activeGame)) {
              const startedState = this.gameRuntime.startRound(room);

              if (startedState) {
                this.playerManager.setAllReady(room, false);
                roomChanged = true;
                restartedReadyRound = true;
              }
            } else if (!allowReadyCarry) {
              roomChanged = this.playerManager.setAllReady(room, false) || roomChanged;
            }
          }
        }

        if (update?.stateChanged || restartedReadyRound) {
          stateChangedRooms += 1;
          this.stateBroadcaster.broadcastGameState(room);
        }

        if (update?.scoreChanged || restartedReadyRound) {
          scoreChangedRooms += 1;
          this.stateBroadcaster.broadcastScoreboard(room);
        }

        if (roomChanged || update?.phaseChanged || restartedReadyRound) {
          changedRooms += 1;
          this.stateBroadcaster.broadcastRoomState(room);
        }
      }

      serverPerfRegistry.sample("round-timer", "round-timer", {
        timingsMs: {
          cycle: performance.now() - cycleStart
        },
        counters: {
          rooms: roomCount,
          tickMs: this.tickMs,
          changedRooms,
          stateChangedRooms,
          scoreChangedRooms
        }
      });
    }, this.tickMs);

    // TODO: Fuer Produktionsbetrieb spaeter auf ein explizites Scheduler-/Shutdown-Handling erweitern.
    logger.info("Round timer started.", { tickMs: this.tickMs });
  }

  stop(): void {
    if (!this.intervalHandle) {
      return;
    }

    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }
}
