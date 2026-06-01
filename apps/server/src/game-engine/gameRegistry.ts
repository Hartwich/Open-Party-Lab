import {
  defaultLanguage,
  localizeGameManifest,
  type GameManifest,
  type ServerGame,
  type SupportedLanguage
} from "@open-party-lab/game-core";
import type { AvailableGameDto } from "@open-party-lab/protocol";
import { externalServerGameEntries } from "./.generated/externalGames.js";

export interface ServerGameEntry {
  manifest: GameManifest;
  serverGame: ServerGame<any, any>;
}

export class GameRegistry {
  private readonly games = new Map<string, ServerGameEntry>([
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
      roundCompletionMode: manifest.roundCompletionMode,
      lobbySetup: manifest.lobbySetup,
      playerSetup: manifest.playerSetup
    };
  }
}
