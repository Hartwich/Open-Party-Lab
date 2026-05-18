import Phaser from "phaser";
import type { HostSocketClient } from "../app/hostSocketClient.js";
import { getHostText } from "../i18n/hostText.js";
import { hostTheme } from "../ui/theme/theme.js";

export class RoundIntroScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private readonly contentKey = "round-intro-content";

  constructor() {
    super("RoundIntroScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;

    this.unsubscribe = client.subscribe((state) => {
      const text = getHostText(state.room?.language ?? state.preferredLanguage);
      const title = state.room?.availableGames.find((game) => game.id === state.room?.selectedGameId)?.displayName ?? text.roundFallbackTitle;
      this.render(title, state.game?.message ?? text.roundFallbackMessage);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
    });
  }

  private render(title: string, message: string): void {
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor("#1e293b");

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, `${title}\n\n${message}`, {
        fontFamily: hostTheme.titleFont,
        fontSize: "46px",
        color: hostTheme.text,
        align: "center",
        wordWrap: { width: this.scale.width - 180 }
      })
      .setOrigin(0.5)
      .setName(this.contentKey);
  }
}
