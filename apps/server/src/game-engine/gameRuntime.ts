import { localizeGameManifest } from "@open-party-lab/game-core";
import type {
  BaseRoundState,
  GameManifest,
  PerfTelemetrySampleInput,
  PlayerInput,
  PreviousRoundContext,
  ServerGameContext
} from "@open-party-lab/game-core";
import type { GameStateEnvelope } from "@open-party-lab/protocol";
import { performance } from "node:perf_hooks";
import { serverPerfRegistry } from "../core/perf/serverPerfRegistry.js";
import { now } from "../core/time/now.js";
import { roomPlayersToSummaries } from "../games/shared/gameHelpers.js";
import type { RoomRecord } from "../rooms/roomStore.js";
import { GameRegistry } from "./gameRegistry.js";
import { GameTransitionService } from "./gameTransitionService.js";
import { RoundManager } from "./roundManager.js";

export interface GameRuntimeUpdate {
  stateChanged: boolean;
  scoreChanged: boolean;
  phaseChanged: boolean;
  roomChanged: boolean;
}

export class GameRuntime {
  constructor(
    private readonly gameRegistry: GameRegistry,
    private readonly roundManager: RoundManager,
    private readonly gameTransitionService: GameTransitionService,
    private readonly getNow: () => number = now
  ) {}

  selectGame(room: RoomRecord, gameId: string): void {
    this.gameRegistry.require(gameId);
    room.selectedGameId = gameId;
    room.currentRound = null;
  }

  abortRound(room: RoomRecord): boolean {
    if (!room.currentRound) {
      return false;
    }

    room.currentRound = null;
    return true;
  }

  startRound(room: RoomRecord): GameStateEnvelope | null {
    const totalStart = performance.now();

    if (!room.selectedGameId) {
      return null;
    }

    if (room.currentRound && room.currentRound.phase !== "finished") {
      return null;
    }

    const game = this.gameRegistry.require(room.selectedGameId);
    const roundNumber = room.roundCounter + 1;
    const previousRound: PreviousRoundContext | null = room.currentRound
      ? {
          gameId: room.currentRound.gameId,
          roundNumber: room.currentRound.roundNumber,
          phase: room.currentRound.phase,
          state: room.currentRound.state,
          updatedAt: room.currentRound.updatedAt
        }
      : null;
    const initialContext = this.buildContext(room, roundNumber, game.manifest, 0, previousRound);
    const initialState = game.serverGame.createInitialState(initialContext);

    this.roundManager.openRound(room, game.manifest.id, initialState);

    this.samplePerf(room, "runtime:start-round", `runtime-start-round:${game.manifest.id}`, {
      timingsMs: {
        total: performance.now() - totalStart
      },
      tags: {
        gameId: game.manifest.id,
        phase: initialState.phase
      }
    });

    return this.getPublicGameState(room);
  }

  handleInput(
    room: RoomRecord,
    payload: { playerId: string; input: unknown }
  ): GameRuntimeUpdate | null {
    const totalStart = performance.now();

    if (!room.currentRound) {
      return null;
    }

    const game = this.gameRegistry.require(room.currentRound.gameId);
    const currentState = room.currentRound.state as BaseRoundState;
    const gameHandleStart = performance.now();
    const nextState = game.serverGame.handleInput(
      currentState,
      payload.input as PlayerInput,
      this.buildContext(room, room.currentRound.roundNumber, game.manifest, 0)
    );
    const gameHandleMs = performance.now() - gameHandleStart;

    const stateChanged = nextState !== currentState;
    const phaseChangedFromInput = nextState.phase !== currentState.phase;

    if (stateChanged) {
      this.roundManager.replaceState(room, nextState);
    }

    const transitionStart = performance.now();
    const transitionResult = this.gameTransitionService.progressRoom(
      room,
      game,
      (deltaMs) => this.buildContext(room, room.currentRound?.roundNumber ?? 0, game.manifest, deltaMs),
      0,
      false
    );
    const transitionMs = performance.now() - transitionStart;

    const update = {
      stateChanged: stateChanged || transitionResult.stateChanged,
      scoreChanged: transitionResult.scoreChanged,
      phaseChanged: phaseChangedFromInput || transitionResult.phaseChanged,
      roomChanged: false
    };

    this.samplePerf(room, "runtime:input", `runtime-input:${game.manifest.id}`, {
      timingsMs: {
        total: performance.now() - totalStart,
        game: gameHandleMs,
        transition: transitionMs
      },
      counters: {
        roundNumber: room.currentRound.roundNumber
      },
      tags: {
        gameId: game.manifest.id,
        phase: room.currentRound.phase
      },
      flags: {
        stateChanged: update.stateChanged,
        phaseChanged: update.phaseChanged,
        scoreChanged: update.scoreChanged
      }
    });

    return update;
  }

  handleHostAction(
    room: RoomRecord,
    payload: { gameId: string; action: unknown }
  ): GameRuntimeUpdate | null {
    const totalStart = performance.now();

    if (!room.selectedGameId || room.selectedGameId !== payload.gameId) {
      return null;
    }

    const game = this.gameRegistry.require(payload.gameId);

    if (!game.serverGame.handleHostAction) {
      return null;
    }

    const currentRound = room.currentRound?.gameId === payload.gameId ? room.currentRound : null;
    const currentRoundState = (currentRound?.state as BaseRoundState | undefined) ?? null;
    const actionContext = this.buildContext(
      room,
      currentRound?.roundNumber ?? room.roundCounter + 1,
      game.manifest,
      0
    );
    const result = game.serverGame.handleHostAction(
      currentRoundState as never,
      payload.action,
      actionContext
    );

    if (!result) {
      return null;
    }

    let roomChanged = false;

    if (result.roomSettings) {
      const currentGameSettings = room.gameSettingsByGameId[payload.gameId] ?? {};
      const nextRoomSettings = { ...currentGameSettings };

      for (const [key, value] of Object.entries(result.roomSettings)) {
        if (nextRoomSettings[key] === value) {
          continue;
        }

        nextRoomSettings[key] = value;
        roomChanged = true;
      }

      if (roomChanged) {
        room.gameSettingsByGameId = {
          ...room.gameSettingsByGameId,
          [payload.gameId]: nextRoomSettings
        };
      }
    }

    let stateChanged = false;
    let phaseChanged = false;

    if (currentRoundState && result.state && result.state !== currentRoundState) {
      this.roundManager.replaceState(room, result.state);
      stateChanged = true;
      phaseChanged = result.state.phase !== currentRoundState.phase;
    }

    const update = {
      stateChanged,
      scoreChanged: false,
      phaseChanged,
      roomChanged
    };

    this.samplePerf(room, "runtime:host-action", `runtime-host-action:${game.manifest.id}`, {
      timingsMs: {
        total: performance.now() - totalStart
      },
      counters: {
        roundNumber: currentRound?.roundNumber ?? room.roundCounter + 1
      },
      tags: {
        gameId: game.manifest.id,
        phase: room.currentRound?.phase ?? currentRoundState?.phase ?? null
      },
      flags: {
        stateChanged: update.stateChanged,
        phaseChanged: update.phaseChanged,
        roomChanged: update.roomChanged
      }
    });

    return update;
  }

  tickRoom(room: RoomRecord, deltaMs: number): GameRuntimeUpdate | null {
    const totalStart = performance.now();

    if (!room.currentRound) {
      return null;
    }

    const game = this.gameRegistry.require(room.currentRound.gameId);
    const transitionResult = this.gameTransitionService.progressRoom(
      room,
      game,
      (nextDeltaMs) =>
        this.buildContext(room, room.currentRound?.roundNumber ?? 0, game.manifest, nextDeltaMs),
      deltaMs,
      true
    );

    const update = {
      stateChanged: transitionResult.stateChanged,
      scoreChanged: transitionResult.scoreChanged,
      phaseChanged: transitionResult.phaseChanged,
      roomChanged: false
    };

    this.samplePerf(room, "runtime:tick", `runtime-tick:${game.manifest.id}`, {
      timingsMs: {
        total: performance.now() - totalStart
      },
      counters: {
        roundNumber: room.currentRound.roundNumber,
        deltaMs
      },
      tags: {
        gameId: game.manifest.id,
        phase: room.currentRound.phase
      },
      flags: {
        stateChanged: update.stateChanged,
        phaseChanged: update.phaseChanged,
        scoreChanged: update.scoreChanged
      }
    });

    return update;
  }

  getPublicGameState(room: RoomRecord, audience: "host" | "controller" = "host"): GameStateEnvelope | null {
    const totalStart = performance.now();

    if (!room.currentRound) {
      return null;
    }

    const game = this.gameRegistry.require(room.currentRound.gameId);
    const stateContext = this.buildContext(
      room,
      room.currentRound.roundNumber,
      game.manifest,
      0
    );
    const publicStateStart = performance.now();
    const publicState =
      audience === "controller" && game.serverGame.toControllerState
        ? game.serverGame.toControllerState(room.currentRound.state as never, stateContext)
        : game.serverGame.toPublicState
          ? game.serverGame.toPublicState(room.currentRound.state as never, stateContext)
          : room.currentRound.state;
    const publicStateMs = performance.now() - publicStateStart;

    this.samplePerf(room, `runtime:public:${audience}`, `runtime-public-${audience}:${game.manifest.id}`, {
      timingsMs: {
        total: performance.now() - totalStart,
        publicState: publicStateMs
      },
      counters: {
        roundNumber: room.currentRound.roundNumber
      },
      tags: {
        audience,
        gameId: game.manifest.id,
        phase: room.currentRound.phase
      }
    });

    return {
      gameId: room.currentRound.gameId,
      roundNumber: room.currentRound.roundNumber,
      phase: room.currentRound.phase,
      phaseStartedAt: room.currentRound.phaseStartedAt,
      phaseEndsAt: room.currentRound.phaseEndsAt,
      state: publicState,
      updatedAt: room.currentRound.updatedAt,
      message: room.currentRound.message
    };
  }

  getControllerGameStateForPlayer(room: RoomRecord, playerId: string): GameStateEnvelope | null {
    if (!room.currentRound) {
      return null;
    }

    const game = this.gameRegistry.require(room.currentRound.gameId);

    if (!game.serverGame.toControllerStateForPlayer) {
      return this.getPublicGameState(room, "controller");
    }

    const stateContext = this.buildContext(
      room,
      room.currentRound.roundNumber,
      game.manifest,
      0
    );

    return {
      gameId: room.currentRound.gameId,
      roundNumber: room.currentRound.roundNumber,
      phase: room.currentRound.phase,
      phaseStartedAt: room.currentRound.phaseStartedAt,
      phaseEndsAt: room.currentRound.phaseEndsAt,
      state: game.serverGame.toControllerStateForPlayer(
        room.currentRound.state as never,
        stateContext,
        playerId
      ),
      updatedAt: room.currentRound.updatedAt,
      message: room.currentRound.message
    };
  }

  private samplePerf(
    room: RoomRecord,
    ownerPrefix: string,
    sourceId: string,
    input: PerfTelemetrySampleInput
  ): void {
    serverPerfRegistry.sample(`${ownerPrefix}:${room.code}`, sourceId, {
      ...input,
      counters: {
        players: room.players.size,
        ...(input.counters ?? {})
      },
      tags: {
        roomCode: room.code,
        ...(input.tags ?? {})
      }
    });
  }

  private buildContext(
    room: RoomRecord,
    roundNumber: number,
    selectedGame: GameManifest,
    deltaMs: number,
    previousRound: PreviousRoundContext | null = null
  ): ServerGameContext {
    return {
      roomCode: room.code,
      roundNumber,
      players: roomPlayersToSummaries(room, selectedGame.id),
      now: this.getNow(),
      deltaMs,
      language: room.language,
      selectedGame: localizeGameManifest(selectedGame, room.language),
      previousRound,
      roomSettings: room.gameSettingsByGameId[selectedGame.id] ?? {}
    };
  }
}
