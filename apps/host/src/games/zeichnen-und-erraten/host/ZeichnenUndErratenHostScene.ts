import Phaser from "phaser";
import type { HostSocketClient } from "../../../app/hostSocketClient.js";
import { renderZeichnenUndErratenState } from "./ZeichnenUndErratenRenderer.js";

export class ZeichnenUndErratenHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;

  constructor() {
    super("ZeichnenUndErratenHostScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;

    this.unsubscribe = client.subscribe((state) => {
      const gameState = state.game?.state as
        | {
            drawerName?: string;
            maskedWord?: string;
            revealedWord?: string;
            winnerName?: string;
            strokes?: Array<{ id: string; color: string; points: Array<{ x: number; y: number }> }>;
            guesses?: Array<{ playerName: string; guess: string; correct: boolean }>;
          }
        | undefined;
      const en = state.room?.language === "en";

      this.children.removeAll(true);
      this.cameras.main.setBackgroundColor("#020617");

      renderZeichnenUndErratenState(
        this,
        gameState ?? {},
        state.game?.message ?? (en ? "The drawer paints while the others guess." : "Der Zeichner malt, die anderen raten."),
        state.room?.language
      );
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
    });
  }
}
