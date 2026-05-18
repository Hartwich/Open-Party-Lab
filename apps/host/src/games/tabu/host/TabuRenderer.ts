import Phaser from "phaser";
import type { SupportedLanguage, TabuControllerState, TabuTeamId } from "@open-party-lab/protocol";
import { hostTheme } from "../../../ui/theme/theme.js";

function resolveTeamLabel(teamId?: TabuTeamId): string | undefined {
  if (teamId === "team1") {
    return "Team 1";
  }

  if (teamId === "team2") {
    return "Team 2";
  }

  return undefined;
}

interface TabuRenderState extends Pick<
  TabuControllerState,
  | "mode"
  | "currentModeLabel"
  | "solvedTerms"
  | "targetTerms"
  | "lastSolverName"
  | "lastSolvedTerm"
  | "currentTurnPlayerId"
  | "currentTurnTeamId"
  | "turnRemainingMs"
  | "turnDurationMs"
  | "remainingCards"
  | "teamScoresByTeamId"
> {}

export function renderTabuState(
  scene: Phaser.Scene,
  state: TabuRenderState,
  playerNames: Map<string, string>,
  playerCount: number,
  topY: number,
  message?: string,
  language?: SupportedLanguage
): void {
  const en = language === "en";
  const modeLabel = state.currentModeLabel ?? (state.mode === "team" ? (en ? "Team Mode" : "Teammodus") : en ? "Free-for-all" : "Jeder gegen jeden");
  const currentTurnPlayerName = state.currentTurnPlayerId
    ? playerNames.get(state.currentTurnPlayerId) ?? state.currentTurnPlayerId
    : en ? "Unknown" : "Unbekannt";
  const teamLabel = resolveTeamLabel(state.currentTurnTeamId);
  const remainingSeconds =
    state.turnRemainingMs !== null ? Math.max(0, Math.ceil(state.turnRemainingMs / 1000)) : null;
  const solvedLabel =
    state.lastSolvedTerm && state.lastSolverName
      ? `${en ? "Last solved" : "Zuletzt geloest"}: "${state.lastSolvedTerm}" ${en ? "by" : "von"} ${state.lastSolverName}`
      : state.lastSolvedTerm
        ? `${en ? "Last solved" : "Zuletzt geloest"}: "${state.lastSolvedTerm}"`
        : en ? "No word solved yet." : "Noch kein Wort geloest.";
  const turnLabel =
    state.mode === "team"
      ? `${teamLabel ?? "Team"} ${en ? "explains" : "erklaert"}: ${currentTurnPlayerName}`
      : `${en ? "Explainer" : "Erklaerer"}: ${currentTurnPlayerName}`;
  const timingLabel =
    remainingSeconds !== null
      ? `${en ? "Turn time" : "Zeit in diesem Zug"}: ${remainingSeconds}s / ${Math.max(1, Math.ceil(state.turnDurationMs / 1000))}s`
      : en ? "No active turn timer." : "Keine aktive Zugzeit.";
  const progressLabel = `${en ? "Progress" : "Fortschritt"}: ${state.solvedTerms}/${state.targetTerms} | ${en ? "Cards left" : "Karten uebrig"}: ${state.remainingCards}`;
  const teamScoreLabel =
    state.mode === "team"
      ? `${en ? "Team score" : "Teamstand"}: Team 1 ${state.teamScoresByTeamId.team1 ?? 0} | Team 2 ${state.teamScoresByTeamId.team2 ?? 0}`
      : en ? "Free-for-all: points go to the named guesser." : "Jeder gegen jeden: Punkte gehen an den genannten Rater.";
  const playerLabel = `${en ? "Players in room" : "Spieler im Raum"}: ${playerCount}`;

  const panelWidth = Math.min(scene.scale.width - 80, 1120);
  const panelHeight = 350;
  const panelX = scene.scale.width / 2;
  const panelY = topY + panelHeight / 2;

  scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x0b1220, 0.86).setStrokeStyle(1, 0x334155, 0.9);
  scene.add
    .text(
      panelX,
      topY + 24,
      `Tabu | ${modeLabel}`,
      {
        fontFamily: hostTheme.titleFont,
        fontSize: "38px",
        color: hostTheme.text,
        align: "center"
      }
    )
    .setOrigin(0.5, 0);

  scene.add
    .text(
      panelX,
      topY + 84,
      [
        turnLabel,
        solvedLabel,
        timingLabel,
        progressLabel,
        teamScoreLabel,
        message ?? (en ? "The current word is only visible to the explainer." : "Das aktuelle Wort bleibt nur beim Erklaerer sichtbar."),
        playerLabel
      ].join("\n\n"),
      {
        fontFamily: hostTheme.bodyFont,
        fontSize: "26px",
        color: hostTheme.text,
        align: "center",
        lineSpacing: 10,
        wordWrap: { width: Math.max(420, panelWidth - 80) }
      }
    )
    .setOrigin(0.5, 0);
}
