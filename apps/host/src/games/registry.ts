import { externalHostGameRegistry } from "./.generated/externalGames.js";

export const hostGameRegistry: Record<
  string,
  { id: string; displayName: string; sceneKey: string }
> = {
  ...externalHostGameRegistry
};
