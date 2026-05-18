import type {
  SchaetzoramaAnswer,
  SchaetzoramaAnswerSet,
  SchaetzoramaCategoryId,
  SchaetzoramaJokerSelection,
  SchaetzoramaPlayerRoundResult,
  SchaetzoramaQuestion
} from "@open-party-lab/protocol";
import type { GamePlayerSummary } from "@open-party-lab/game-core";

export const schaetzoramaCategoryIds: SchaetzoramaCategoryId[] = ["number", "percent", "rank", "assign"];

export function scoreSchaetzoramaAnswer(question: SchaetzoramaQuestion, answer: SchaetzoramaAnswer | undefined): number {
  if (!answer) {
    return 0;
  }

  if ((question.kind === "number" || question.kind === "percent") && answer.kind === "number") {
    const diff = Math.abs(answer.value - question.answer);

    if (question.kind === "percent") {
      if (diff <= 5) {
        return 5;
      }
      if (diff <= 10) {
        return 3;
      }
      if (diff <= 15) {
        return 1;
      }
      return 0;
    }

    if (diff === 0) {
      return 5;
    }
    if (diff <= 2) {
      return 3;
    }
    if (diff <= 5) {
      return 1;
    }
    return 0;
  }

  if (question.kind === "rank" && answer.kind === "rank") {
    const normalized = answer.order.filter((itemId) => question.items.some((item) => item.id === itemId));

    if (normalized.length !== question.answerOrder.length) {
      return 0;
    }

    const allCorrect = question.answerOrder.every((itemId, index) => normalized[index] === itemId);

    if (allCorrect) {
      return 5;
    }

    if (normalized[0] === question.answerOrder[0]) {
      return 3;
    }

    if (normalized[normalized.length - 1] === question.answerOrder[question.answerOrder.length - 1]) {
      return 1;
    }

    return 0;
  }

  if (question.kind === "assign" && answer.kind === "assign") {
    return question.terms.reduce(
      (score, term) => score + (answer.assignments[term.id] === question.answers[term.id] ? 1 : 0),
      0
    );
  }

  return 0;
}

export function buildSchaetzoramaResults(
  players: GamePlayerSummary[],
  questions: Record<SchaetzoramaCategoryId, SchaetzoramaQuestion>,
  answersByPlayerId: Record<string, { answers: SchaetzoramaAnswerSet }>,
  jokerByPlayerId: Record<string, SchaetzoramaJokerSelection | null>
): SchaetzoramaPlayerRoundResult[] {
  const answersByPlayer = new Map<string, SchaetzoramaAnswerSet>(
    players.map((player) => [player.id, answersByPlayerId[player.id]?.answers ?? {}])
  );
  const baseScoresByPlayer = new Map<string, Record<SchaetzoramaCategoryId, number>>();

  for (const player of players) {
    const answers = answersByPlayer.get(player.id) ?? {};
    const categoryScores = createEmptyCategoryScores();

    for (const categoryId of schaetzoramaCategoryIds) {
      categoryScores[categoryId] = scoreSchaetzoramaAnswer(questions[categoryId], answers[categoryId]);
    }

    baseScoresByPlayer.set(player.id, categoryScores);
  }

  return players.map((player) => {
    const answers = answersByPlayer.get(player.id) ?? {};
    const displayedAnswers = { ...answers };
    const baseCategoryScores = baseScoresByPlayer.get(player.id) ?? createEmptyCategoryScores();
    const categoryScores = { ...baseCategoryScores };
    const joker = jokerByPlayerId[player.id] ?? null;

    if (joker?.kind === "copy" && joker.targetPlayerId) {
      const copiedScores = baseScoresByPlayer.get(joker.targetPlayerId);
      const copiedAnswers = answersByPlayer.get(joker.targetPlayerId);

      categoryScores[joker.categoryId] = copiedScores?.[joker.categoryId] ?? categoryScores[joker.categoryId];
      displayedAnswers[joker.categoryId] = copiedAnswers?.[joker.categoryId] ?? displayedAnswers[joker.categoryId];
    }

    return {
      playerId: player.id,
      name: player.name,
      color: player.color,
      answers: displayedAnswers,
      joker,
      categoryScores,
      baseCategoryScores,
      total: schaetzoramaCategoryIds.reduce((sum, categoryId) => sum + categoryScores[categoryId], 0)
    };
  });
}

export function createEmptyCategoryScores(): Record<SchaetzoramaCategoryId, number> {
  return {
    number: 0,
    percent: 0,
    rank: 0,
    assign: 0
  };
}
