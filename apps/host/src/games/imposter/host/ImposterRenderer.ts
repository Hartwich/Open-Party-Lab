import Phaser from "phaser";
import type { SupportedLanguage } from "@open-party-lab/protocol";
import { hostTheme } from "../../../ui/theme/theme.js";

interface ImposterRenderState {
  stage?: string;
  category?: string;
  currentTurnPlayerId?: string;
  clueTurnsCompleted?: number;
  clueTurnsTotal?: number;
  voteCounts?: Array<{ playerId: string; playerName: string; votes: number }>;
  secretWord?: string;
  imposterRevealName?: string;
  imposterGuess?: string;
  imposterWon?: boolean;
  resolvedReason?: string;
  message?: string;
}

export function renderImposterState(
  scene: Phaser.Scene,
  state: ImposterRenderState,
  playerNames: Record<string, string>,
  language?: SupportedLanguage
): Phaser.GameObjects.Text {
  const en = language === "en";
  const votes = (state.voteCounts ?? [])
    .map((entry) => `- ${entry.playerName}: ${entry.votes} ${en ? "votes" : "Stimmen"}`)
    .join("\n");
  const currentTurnName = state.currentTurnPlayerId ? playerNames[state.currentTurnPlayerId] ?? state.currentTurnPlayerId : "-";

  const resolution = state.secretWord
    ? `\n\n${en ? "Resolution" : "Aufloesung"}\nImposter: ${state.imposterRevealName ?? "?"}\n${en ? "Word" : "Wort"}: ${state.secretWord}\n${en ? "Guess" : "Tipp"}: ${state.imposterGuess ?? "-"}\n${state.resolvedReason ?? ""}\n${state.imposterWon ? (en ? "Imposter wins" : "Imposter gewinnt") : en ? "Crew wins" : "Crew gewinnt"}`
    : "";

  return scene.add
    .text(
      scene.scale.width / 2,
      scene.scale.height / 2,
      `Imposter\n\nPhase: ${state.stage ?? "-"}\n${en ? "Category" : "Kategorie"}: ${state.category ?? "-"}\n${en ? "Clue round" : "Hinweisphase"}: ${state.clueTurnsCompleted ?? 0}/${state.clueTurnsTotal ?? 0}\n${en ? "Current" : "Aktuell"}: ${currentTurnName}\n\n${state.message ?? (en ? "Find the Imposter." : "Findet den Imposter.")}\n\nVotes\n${votes || (en ? "No votes yet" : "Noch keine Stimmen")}${resolution}`,
      {
        fontFamily: hostTheme.titleFont,
        fontSize: "34px",
        color: hostTheme.text,
        align: "center",
        wordWrap: { width: scene.scale.width - 140 }
      }
    )
    .setOrigin(0.5);
}
