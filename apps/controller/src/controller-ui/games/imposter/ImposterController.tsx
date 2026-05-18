import type { ControllerGameRenderContext } from "../registry.js";
import type { ChoiceLayoutModel } from "../../layouts/models.js";
import {
  createImposterGuessInput,
  createImposterVoteInput
} from "./imposterBindings.js";

interface ImposterControllerState {
  stage?: "clues" | "voting" | "imposter_guess" | "resolved";
  role?: "imposter" | "crew";
  roleLabel?: string;
  category?: string;
  secretWord?: string;
  clueOrder?: string[];
  currentTurnPlayerId?: string;
  clueTurnsCompleted?: number;
  clueTurnsTotal?: number;
  votesByPlayer?: Record<string, string>;
  hasVoted?: boolean;
  voteOptions?: Array<{ id: string; disabled: boolean }>;
  imposterGuessOptions?: string[];
  resolvedReason?: string;
  imposterWon?: boolean;
}

function getCurrentTurnLabel(imposterState: ImposterControllerState, playerNames: Record<string, string>): string | undefined {
  const currentPlayerId = imposterState.currentTurnPlayerId;
  if (!currentPlayerId) {
    return undefined;
  }

  return playerNames[currentPlayerId] ?? currentPlayerId;
}

function formatStageLabel(stage: NonNullable<ImposterControllerState["stage"]>, en: boolean): string {
  switch (stage) {
    case "clues":
      return en ? "Clues" : "Hinweise";
    case "voting":
      return en ? "Voting" : "Abstimmung";
    case "imposter_guess":
      return en ? "Imposter guess" : "Imposter-Tipp";
    case "resolved":
      return en ? "Resolved" : "Aufgeloest";
    default:
      return stage;
  }
}

export function buildImposterControllerModel({ state, onInput }: ControllerGameRenderContext): ChoiceLayoutModel {
  const imposterState = (state.game?.state ?? {}) as ImposterControllerState;
  const en = state.room?.language === "en";
  const playerId = state.player?.id ?? "";
  const phase = state.game?.phase;
  const players = state.room?.players ?? [];
  const playerNames = Object.fromEntries(players.map((player) => [player.id, player.name]));
  const stage = imposterState.stage ?? "clues";
  const title = state.room?.availableGames.find((game) => game.id === "imposter")?.displayName ?? "Imposter";
  const isImposter = imposterState.role === "imposter";
  const isCurrentTurn = stage === "clues" && imposterState.currentTurnPlayerId === playerId;
  const clueTurnsCompleted = imposterState.clueTurnsCompleted ?? 0;
  const clueTurnsTotal = imposterState.clueTurnsTotal ?? 0;
  const currentTurnLabel = getCurrentTurnLabel(imposterState, playerNames);

  const choices: ChoiceLayoutModel["choices"] = [];

  if (stage === "clues") {
    if (isCurrentTurn) {
      choices.push({
        id: "clue:done",
        label: en ? "Clue given" : "Hinweis abgegeben",
        description: en ? "Once you are done speaking, tap here to continue." : "Wenn du fertig gesprochen hast, tippe hier weiter.",
        disabled: phase !== "playing",
        onSelect: () => onInput({ type: "submit_clue", playerId, clue: "", sentAt: Date.now() })
      });
    }
  }

  if (stage === "voting") {
    for (const voteOption of imposterState.voteOptions ?? []) {
      choices.push({
        id: `vote:${voteOption.id}`,
        label: playerNames[voteOption.id] ?? voteOption.id,
        description: en ? "Suspect as the Imposter" : "Als Imposter verdaechtigen",
        disabled: phase !== "playing" || voteOption.disabled,
        onSelect: () => onInput(createImposterVoteInput(playerId, voteOption.id))
      });
    }
  }

  if (stage === "imposter_guess") {
    for (const guessOption of imposterState.imposterGuessOptions ?? []) {
      choices.push({
        id: `guess:${guessOption}`,
        label: guessOption,
        description: en ? "Guess the word as Imposter" : "Wort als Imposter erraten",
        disabled: phase !== "playing",
        onSelect: () => onInput(createImposterGuessInput(playerId, guessOption))
      });
    }
  }

  const feed = (imposterState.clueOrder ?? []).map((turnPlayerId, index) => {
    const prefix = `${index + 1}. ${playerNames[turnPlayerId] ?? turnPlayerId}`;
    return en ? `${prefix} is up` : `${prefix} ist in der Reihe`;
  });

  return {
    kind: "choice",
    title,
    subtitle: imposterState.roleLabel ?? (en ? "Assigning roles ..." : "Rolle wird verteilt ..."),
    helperText:
      imposterState.resolvedReason ??
      state.game?.message ??
      (stage === "clues"
        ? isCurrentTurn
          ? en
            ? "Say your clue out loud, then tap Clue given."
            : "Sprich deinen Hinweis muendlich und tippe danach auf Hinweis abgegeben."
          : currentTurnLabel
            ? `${en ? "Waiting for" : "Warte auf"} ${currentTurnLabel}.`
            : en ? "Waiting for the next turn." : "Warte auf den naechsten Zug."
        : undefined) ??
      (en ? "Give a clue or find the Imposter." : "Gib einen Hinweis oder finde den Imposter."),
    disabled: phase !== "playing",
    choices:
      choices.length > 0 ? choices : [],
    stats: [
      { label: en ? "Category" : "Kategorie", value: imposterState.category ?? "-" },
      {
        label: en ? "Secret Word" : "Geheimes Wort",
        value: isImposter ? imposterState.secretWord ?? "???" : en ? "hidden" : "verborgen"
      },
      {
        label: en ? "Clue Round" : "Hinweisrunde",
        value: clueTurnsTotal > 0 ? `${clueTurnsCompleted}/${clueTurnsTotal}` : "-"
      },
      { label: "Phase", value: formatStageLabel(stage, en) }
    ],
    feed
  };
}
