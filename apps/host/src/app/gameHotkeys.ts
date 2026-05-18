import Phaser from "phaser";
import type { HostSocketClient } from "./hostSocketClient.js";

const digitKeys = [
  "ONE",
  "TWO",
  "THREE",
  "FOUR",
  "FIVE",
  "SIX",
  "SEVEN",
  "EIGHT",
  "NINE"
] as const;

export function bindGameSelectionHotkeys(
  scene: Phaser.Scene,
  client: HostSocketClient
): () => void {
  const cleanupCallbacks: Array<() => void> = [];

  for (const [index, keyName] of digitKeys.entries()) {
    const handler = () => {
      const availableGame = client.getState().room?.availableGames[index];

      if (availableGame) {
        client.selectGame(availableGame.id);
      }
    };

    scene.input.keyboard?.on(`keydown-${keyName}`, handler);
    cleanupCallbacks.push(() => {
      scene.input.keyboard?.off(`keydown-${keyName}`, handler);
    });
  }

  return () => {
    for (const cleanup of cleanupCallbacks) {
      cleanup();
    }
  };
}
