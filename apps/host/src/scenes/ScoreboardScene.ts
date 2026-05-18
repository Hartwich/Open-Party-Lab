import Phaser from "phaser";
import { getRoomPhase } from "@open-party-lab/protocol";
import type { HostSocketClient } from "../app/hostSocketClient.js";
import { getSelectedGame, requiresReadyAutoStart } from "../app/roundStartPolicy.js";
import { getHostText } from "../i18n/hostText.js";
import { hostTheme } from "../ui/theme/theme.js";

export class ScoreboardScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private readonly contentKey = "scoreboard-content";

  constructor() {
    super("ScoreboardScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;
    const handleStartRound = () => client.startRound();
    this.input.keyboard?.on("keydown-SPACE", handleStartRound);

    this.unsubscribe = client.subscribe((state) => {
      const text = getHostText(state.room?.language ?? state.preferredLanguage);
      const nameById = new Map((state.room?.players ?? []).map((player) => [player.id, player.name]));
      const selectedGame = getSelectedGame(state.room);
      const scoreboardEntries =
        state.scoreboard?.entries
          .map((entry, index) => {
            const playerName = nameById.get(entry.playerId) ?? entry.playerId;
            return `${index + 1}. ${playerName}  ${entry.delta >= 0 ? "+" : ""}${entry.delta}  ${text.scoreTotal} ${entry.total}`;
          })
          .join("\n") ?? text.noPoints;
      const phase = state.game?.phase ?? getRoomPhase(state.room) ?? "scoreboard";
      const title =
        phase === "result" ? text.roundEndTitle : phase === "finished" ? text.readyNextTitle : text.scoreboardTitle;
      const summary =
        state.game?.message ??
        (selectedGame ? text.gameCompleted(selectedGame.displayName) : text.roundCompleted);

      this.render(
        title,
        summary,
        scoreboardEntries,
        requiresReadyAutoStart(selectedGame)
          ? text.nextAutoHint
          : text.nextSpaceHint
      );
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.input.keyboard?.off("keydown-SPACE", handleStartRound);
    });
  }

  private render(title: string, summary: string, scoreboardText: string, actionHint: string): void {
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor("#111827");

    this.add
      .text(80, 80, `${title}\n\n${summary}\n\n${scoreboardText}\n\n${actionHint}`, {
        fontFamily: hostTheme.bodyFont,
        fontSize: "32px",
        color: hostTheme.text,
        lineSpacing: 12,
        wordWrap: { width: this.scale.width - 160 }
      })
      .setName(this.contentKey);
  }
}
