import Phaser from "phaser";
import type { HostSocketClient } from "../../../app/hostSocketClient.js";
import { hostTheme } from "../../../ui/theme/theme.js";

interface PantomimeHostState {
  actorName?: string;
  secretTerm?: string;
  finishAt?: number | null;
  message?: string;
}

export class PantomimeHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;

  constructor() {
    super("PantomimeHostScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;

    this.unsubscribe = client.subscribe((state) => {
      const gameState = (state.game?.state ?? {}) as PantomimeHostState;
      const en = state.room?.language === "en";
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.ceil(((gameState.finishAt ?? now) - now) / 1000));

      this.children.removeAll(true);
      this.cameras.main.setBackgroundColor(hostTheme.panel);

      this.add
        .text(this.scale.width * 0.5, 68, "Pantomime", {
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: "64px",
          color: "#f8fafc"
        })
        .setOrigin(0.5, 0);

      this.add
        .text(this.scale.width * 0.5, 160, gameState.message ?? (en ? "One player acts out a term." : "Ein Spieler stellt einen Begriff dar."), {
          fontFamily: '"Nunito Sans", sans-serif',
          fontSize: "30px",
          color: "#cbd5e1",
          align: "center",
          wordWrap: { width: this.scale.width - 140 }
        })
        .setOrigin(0.5, 0);

      this.add
        .text(this.scale.width * 0.5, 290, `${en ? "Actor" : "Darsteller"}: ${gameState.actorName ?? "?"}`, {
          fontFamily: '"Nunito Sans", sans-serif',
          fontSize: "40px",
          color: "#fde047"
        })
        .setOrigin(0.5, 0);

      this.add
        .text(this.scale.width * 0.5, 365, gameState.secretTerm ?? "?", {
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: "84px",
          color: "#86efac"
        })
        .setOrigin(0.5, 0);

      this.add
        .text(this.scale.width * 0.5, 495, `${en ? "Time" : "Zeit"}: ${secondsLeft}s`, {
          fontFamily: '"Nunito Sans", sans-serif',
          fontSize: "36px",
          color: "#f8fafc"
        })
        .setOrigin(0.5, 0);

      this.add
        .text(this.scale.width * 0.5, 560, en ? "Everyone else guesses out loud." : "Alle anderen raten laut.", {
          fontFamily: '"Nunito Sans", sans-serif',
          fontSize: "26px",
          color: "#cbd5e1"
        })
        .setOrigin(0.5, 0);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
    });
  }
}
