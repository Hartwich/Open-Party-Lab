import Phaser from "phaser";
import type { HostSocketClient } from "../../../app/hostSocketClient.js";
import { renderTapRaceState } from "./TapRaceRenderer.js";

export class TapRaceHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;

  constructor() {
    super("TapRaceHostScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;

    this.unsubscribe = client.subscribe((state) => {
      const gameState = state.game?.state as
        | {
            targetTaps?: number;
            tapsByPlayer?: Record<string, number>;
            winnerName?: string;
            winningTapCount?: number;
            message?: string;
          }
        | undefined;

      const playerNames = Object.fromEntries(
        (state.room?.players ?? []).map((player) => [player.id, player.name])
      );

      this.children.removeAll(true);
      this.cameras.main.setBackgroundColor("#0f172a");
      renderTapRaceState(this, gameState ?? {}, playerNames, state.room?.language);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
    });
  }
}
