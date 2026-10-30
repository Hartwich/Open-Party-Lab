import type { GameManifest } from "../types/GameManifest.js";

/** Resolve conditional setup on the server before sending catalog/player choices. */
export function resolvePlayerSetup<T extends Pick<GameManifest, "playerSetup" | "lobbySetup">>(
  game: T, settings: Readonly<Record<string, unknown>> = {}
): T {
  const condition = game.playerSetup?.visibleWhen;
  if (!condition) return game;
  const field = game.lobbySetup?.fields.find((entry) => (entry.settingKey ?? entry.id) === condition.field);
  const value = settings[condition.field] ?? field?.defaultValue;
  return condition.anyOf.includes(String(value)) ? game : { ...game, playerSetup: undefined };
}
