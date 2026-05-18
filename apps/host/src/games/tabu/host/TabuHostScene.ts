import Phaser from "phaser";
import type { TabuControllerState, TabuMode } from "@open-party-lab/protocol";
import type { HostSocketClient } from "../../../app/hostSocketClient.js";
import { hostTheme } from "../../../ui/theme/theme.js";
import { renderTabuHud } from "./TabuHud.js";
import { renderTabuState } from "./TabuRenderer.js";

export class TabuHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private selectedMode: TabuMode = "duel";

  constructor() {
    super("TabuHostScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;

    this.unsubscribe = client.subscribe((state) => {
      const gameState = state.game?.state as TabuControllerState | undefined;
      const language = state.room?.language;
      const en = language === "en";
      const playerNames = new Map((state.room?.players ?? []).map((player) => [player.id, player.name]));
      const fallbackState: TabuControllerState = {
        mode: this.selectedMode,
        currentModeLabel: this.selectedMode === "team" ? (en ? "Team Mode" : "Teammodus") : en ? "Free-for-all" : "Jeder gegen jeden",
        solvedTerms: 0,
        targetTerms: 10,
        solvedByPlayerId: {},
        solvedByTeamId: { team1: 0, team2: 0 },
        teamByPlayerId: {},
        currentTurnPlayerId: undefined,
        currentTurnTeamId: undefined,
        isExplainer: false,
        turnDurationMs: this.selectedMode === "team" ? 30_000 : 15_000,
        turnEndsAt: null,
        turnRemainingMs: null,
        turnIndex: 0,
        guesserPlayerIds: [],
        activeTeamPlayerIds: [],
        teamScoresByTeamId: { team1: 0, team2: 0 },
        remainingCards: 0
      };

      if (gameState?.mode) {
        this.selectedMode = gameState.mode;
      }

      this.children.removeAll(true);
      this.cameras.main.setBackgroundColor(hostTheme.panel);

      const hudBottom = renderTabuHud(this, {
        roomCode: state.room?.code ?? "----",
        mode: gameState?.mode ?? this.selectedMode,
        language,
        onSelectMode: (mode) => {
          this.selectedMode = mode;
          client.sendGameHostAction("tabu", {
            type: "set_mode",
            mode
          });
        }
      });

      renderTabuState(
        this,
        gameState ?? fallbackState,
        playerNames,
        state.room?.players.length ?? 0,
        hudBottom + 24,
        state.game?.message,
        language
      );
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
    });
  }
}
