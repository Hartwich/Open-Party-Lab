import {
  defaultLanguage,
  localizeGameManifest,
  type GameManifest,
  type ServerGame,
  type SupportedLanguage
} from "@open-party-lab/game-core";
import type { AvailableGameDto } from "@open-party-lab/protocol";
import { arenaSurvivorServerGame } from "../games/arena-survivor/server/ArenaSurvivorServerGame.js";
import { chaosKommandoServerGame } from "../games/chaos-kommando/server/ChaosKommandoServerGame.js";
import { minionsTdServerGame } from "../games/minions-td/server/MinionsTdServerGame.js";
import { lightTrailsServerGame } from "../games/light-trails/server/LightTrailsServerGame.js";
import { pantomimeServerGame } from "../games/pantomime/server/pantomimeServerGame.js";
import { imposterServerGame } from "../games/imposter/server/ImposterServerGame.js";
import { tabuServerGame } from "../games/tabu/server/tabuServerGame.js";
import { zeichnenUndErratenServerGame } from "../games/zeichnen-und-erraten/server/zeichnenUndErratenServerGame.js";
import { airHockeyServerGame } from "../games/air-hockey/server/airHockeyServerGame.js";
import { driftRacerServerGame } from "../games/drift-racer/server/DriftRacerServerGame.js";
import { schaetzoramaServerGame } from "../games/schaetzorama/server/schaetzoramaServerGame.js";
import { wordTilesServerGame } from "../games/word-tiles/server/wordTilesServerGame.js";
import { externalServerGameEntries } from "./.generated/externalGames.js";

export interface ServerGameEntry {
  manifest: GameManifest;
  serverGame: ServerGame<any, any>;
}

export class GameRegistry {
  private readonly games = new Map<string, ServerGameEntry>([
    [
      driftRacerServerGame.manifest.id,
      { manifest: driftRacerServerGame.manifest, serverGame: driftRacerServerGame }
    ],
    [
      arenaSurvivorServerGame.manifest.id,
      { manifest: arenaSurvivorServerGame.manifest, serverGame: arenaSurvivorServerGame }
    ],
    [
      chaosKommandoServerGame.manifest.id,
      { manifest: chaosKommandoServerGame.manifest, serverGame: chaosKommandoServerGame }
    ],
    [
      minionsTdServerGame.manifest.id,
      { manifest: minionsTdServerGame.manifest, serverGame: minionsTdServerGame }
    ],
    [
      pantomimeServerGame.manifest.id,
      { manifest: pantomimeServerGame.manifest, serverGame: pantomimeServerGame }
    ],
    [
      lightTrailsServerGame.manifest.id,
      { manifest: lightTrailsServerGame.manifest, serverGame: lightTrailsServerGame }
    ],
    [
      imposterServerGame.manifest.id,
      { manifest: imposterServerGame.manifest, serverGame: imposterServerGame }
    ],
    [
      tabuServerGame.manifest.id,
      { manifest: tabuServerGame.manifest, serverGame: tabuServerGame }
    ],
    [
      zeichnenUndErratenServerGame.manifest.id,
      { manifest: zeichnenUndErratenServerGame.manifest, serverGame: zeichnenUndErratenServerGame }
    ],
    [
      schaetzoramaServerGame.manifest.id,
      { manifest: schaetzoramaServerGame.manifest, serverGame: schaetzoramaServerGame }
    ],
    [
      wordTilesServerGame.manifest.id,
      { manifest: wordTilesServerGame.manifest, serverGame: wordTilesServerGame }
    ],
    [
      airHockeyServerGame.manifest.id,
      { manifest: airHockeyServerGame.manifest, serverGame: airHockeyServerGame }
    ],
    ...externalServerGameEntries.map((entry) => [
      entry.manifest.id,
      entry
    ] as const)
  ]);

  get(gameId: string): ServerGameEntry | undefined {
    return this.games.get(gameId);
  }

  require(gameId: string): ServerGameEntry {
    const game = this.get(gameId);

    if (!game) {
      throw new Error(`Unknown game "${gameId}".`);
    }

    return game;
  }

  getAvailableGame(
    gameId: string,
    language: SupportedLanguage = defaultLanguage
  ): AvailableGameDto | undefined {
    const manifest = this.get(gameId)?.manifest;

    return manifest ? this.toAvailableGameDto(localizeGameManifest(manifest, language)) : undefined;
  }

  listAvailableGames(language: SupportedLanguage = defaultLanguage): AvailableGameDto[] {
    return [...this.games.values()]
      .map((entry) => entry.manifest)
      .filter((manifest) => manifest.listed !== false)
      .map((manifest) => this.toAvailableGameDto(localizeGameManifest(manifest, language)));
  }

  private toAvailableGameDto(manifest: GameManifest): AvailableGameDto {
    return {
      id: manifest.id,
      displayName: manifest.displayName,
      description: manifest.description,
      minPlayers: manifest.minPlayers,
      maxPlayers: manifest.maxPlayers,
      hostView: manifest.hostView,
      controllerView: manifest.controllerView,
      controllerLayout: manifest.controllerLayout,
      supportsTeams: manifest.supportsTeams,
      estimatedRoundDurationMs: manifest.estimatedRoundDurationMs,
      roundCompletionMode: manifest.roundCompletionMode
    };
  }
}
