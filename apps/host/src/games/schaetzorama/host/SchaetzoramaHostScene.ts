import Phaser from "phaser";
import type {
  SchaetzoramaAnswer,
  SchaetzoramaAnswerSet,
  SchaetzoramaAssignQuestion,
  SchaetzoramaCategoryId,
  SchaetzoramaPlayerRoundResult,
  SchaetzoramaPublicQuestion,
  SchaetzoramaPublicState,
  SchaetzoramaRankQuestion
} from "@open-party-lab/protocol";
import type { HostSocketClient, HostAppState } from "../../../app/hostSocketClient.js";

const categoryOrder: SchaetzoramaCategoryId[] = ["number", "percent", "rank", "assign"];
const revealStepMs = 5_200;

const categoryAccent: Record<SchaetzoramaCategoryId, number> = {
  number: 0x22c55e,
  percent: 0x3b82f6,
  rank: 0xec4899,
  assign: 0xf97316
};

const categoryLabelByLanguage: Record<"de" | "en", Record<SchaetzoramaCategoryId, string>> = {
  de: {
    number: "1-50",
    percent: "Prozent",
    rank: "Ranking",
    assign: "Zuordnung"
  },
  en: {
    number: "1-50",
    percent: "Percent",
    rank: "Ranking",
    assign: "Assign"
  }
};

interface CategoryEntry {
  result: SchaetzoramaPlayerRoundResult;
  answer: SchaetzoramaAnswer | undefined;
  score: number;
  sortValue: number;
  detail: string;
}

export class SchaetzoramaHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private client?: HostSocketClient;
  private lastChimeKey = "";
  private currentLanguage: "de" | "en" = "de";

  constructor() {
    super("SchaetzoramaHostScene");
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostSocketClient;
    this.client = client;

    this.unsubscribe = client.subscribe(() => {
      this.redrawFromClient();
    });

    this.scale.on(Phaser.Scale.Events.RESIZE, this.redrawFromClient, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.client = undefined;
      this.scale.off(Phaser.Scale.Events.RESIZE, this.redrawFromClient, this);
      this.time.removeAllEvents();
      this.tweens.killAll();
    });
  }

  private redrawFromClient(): void {
    const state = this.client?.getState();

    if (!state) {
      return;
    }

    this.time.removeAllEvents();
    this.tweens.killAll();
    this.children.removeAll(true);
    this.render(state);
  }

  private render(appState: HostAppState): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const gameState = appState.game?.state as SchaetzoramaPublicState | undefined;
    const roomCode = appState.room?.code ?? "----";
    this.currentLanguage = appState.room?.language === "en" ? "en" : "de";

    this.drawBackground(width, height);
    this.renderHeader(roomCode, gameState, width);

    if (!gameState) {
      this.centerText(this.isEnglish() ? "Waiting for the first round." : "Warte auf die erste Runde.", width, height);
      return;
    }

    if (gameState.stage !== "revealed") {
      this.lastChimeKey = "";
      this.renderStagePill(gameState, width);
      this.renderScoreRail(gameState, width - 330, 112, 292, height - 152);
      this.renderQuestions(gameState, width - 370, height);
      this.renderProgress(gameState, 36, height - 84, width - 408);
      return;
    }

    this.renderRevealSequence(gameState, width, height);
  }

  private isEnglish(): boolean {
    return this.currentLanguage === "en";
  }

  private categoryLabel(categoryId: SchaetzoramaCategoryId): string {
    return categoryLabelByLanguage[this.currentLanguage][categoryId];
  }

  private renderHeader(roomCode: string, gameState: SchaetzoramaPublicState | undefined, width: number): void {
    this.add.text(36, 28, "Schaetzorama", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "40px",
      color: "#ffffff"
    });
    this.add.text(38, 76, `${this.isEnglish() ? "Room" : "Raum"} ${roomCode} | ${gameState?.roundContent.roundLabel ?? (this.isEnglish() ? "Quiz panel booting" : "Quiz-Pult bootet")}`, {
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      color: "#dbeafe"
    });

    if (gameState?.stage === "revealed") {
      this.add.text(width - 324, 40, this.isEnglish() ? "Results stay in-game" : "Auswertung laeuft im Spiel", {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "18px",
        color: "#fef3c7"
      });
    }
  }

  private drawBackground(width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x111827, 0x312e81, 0x052e16, 0x7c2d12, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.fillStyle(0xffffff, 0.07);
    for (let i = 0; i < 36; i += 1) {
      graphics.fillCircle((i * 151) % width, 112 + ((i * 83) % Math.max(1, height - 150)), 8 + (i % 4) * 5);
    }
    graphics.lineStyle(2, 0xffffff, 0.08);
    for (let i = 0; i < 11; i += 1) {
      graphics.lineBetween(0, 118 + i * 56, width, 82 + i * 56);
    }
  }

  private renderStagePill(gameState: SchaetzoramaPublicState, width: number): void {
    const end = gameState.stage === "joker" ? gameState.jokerEndsAt : gameState.answerEndsAt;
    const seconds = end ? Math.max(0, Math.ceil((end - Date.now()) / 1000)) : null;
    const label = gameState.stage === "joker"
      ? this.isEnglish() ? "Copy phase" : "Abschreiben-Phase"
      : this.isEnglish() ? "Secret estimates" : "Geheime Schaetzung";
    const text = `${label}${seconds !== null ? ` | ${seconds}s` : ""}`;
    const pill = this.add.graphics();
    pill.fillStyle(0xffffff, 0.14);
    pill.fillRoundedRect(width - 282, 34, 238, 46, 18);
    this.add.text(width - 262, 46, text, {
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      color: "#ffffff"
    });
  }

  private renderQuestions(gameState: SchaetzoramaPublicState, contentWidth: number, height: number): void {
    const cardWidth = Math.max(300, Math.min(520, (contentWidth - 28) / 2));
    const cardHeight = Math.min(196, (height - 230) / 2);
    const startX = 36;
    const startY = 122;

    categoryOrder.forEach((categoryId, index) => {
      const question = gameState.roundContent.questions[categoryId];
      const x = startX + (index % 2) * (cardWidth + 28);
      const y = startY + Math.floor(index / 2) * (cardHeight + 24);
      this.renderQuestionCard(question, x, y, cardWidth, cardHeight);
    });
  }

  private renderQuestionCard(question: SchaetzoramaPublicQuestion, x: number, y: number, width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x020617, 0.58);
    graphics.fillRoundedRect(x, y, width, height, 18);
    graphics.lineStyle(3, categoryAccent[question.categoryId], 0.94);
    graphics.strokeRoundedRect(x, y, width, height, 18);
    graphics.fillStyle(categoryAccent[question.categoryId], 0.92);
    graphics.fillRoundedRect(x + 14, y + 14, 132, 34, 12);

    this.add.text(x + 26, y + 22, this.categoryLabel(question.categoryId), {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "15px",
      color: "#06111f"
    });
    this.add.text(x + 162, y + 19, question.title, {
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      color: "#e0f2fe"
    });
    this.add.text(x + 22, y + 66, question.prompt, {
      fontFamily: "Arial, sans-serif",
      fontSize: "23px",
      color: "#ffffff",
      wordWrap: { width: width - 44 },
      lineSpacing: 4
    });
    this.add.text(x + 22, y + height - 40, this.questionHint(question), {
      fontFamily: "Arial, sans-serif",
      fontSize: "15px",
      color: "#bfdbfe",
      wordWrap: { width: width - 44 }
    });
  }

  private renderProgress(gameState: SchaetzoramaPublicState, x: number, y: number, width: number): void {
    this.add.text(x, y - 34, gameState.stage === "joker"
      ? this.isEnglish() ? "Copy choices locked" : "Abschreiben entschieden"
      : this.isEnglish() ? "Answers locked in" : "Antworten eingeloggt", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "18px",
      color: "#ffffff"
    });
    const itemWidth = Math.min(146, width / Math.max(1, gameState.progress.length));

    gameState.progress.forEach((entry, index) => {
      const done = gameState.stage === "joker" ? entry.jokerReady : entry.answered;
      const itemX = x + index * itemWidth;
      const graphics = this.add.graphics();
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(entry.color).color, done ? 0.88 : 0.22);
      graphics.fillRoundedRect(itemX, y, itemWidth - 10, 44, 14);
      this.add.text(itemX + 12, y + 13, entry.name, {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        color: done ? "#04111f" : "#dbeafe"
      });
    });
  }

  private renderScoreRail(gameState: SchaetzoramaPublicState, x: number, y: number, width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x020617, 0.62);
    graphics.fillRoundedRect(x, y, width, height, 22);
    graphics.lineStyle(2, 0xfacc15, 0.38);
    graphics.strokeRoundedRect(x, y, width, height, 22);

    this.add.text(x + 18, y + 18, this.isEnglish() ? "Current Standings" : "Aktueller Stand", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "21px",
      color: "#ffffff"
    });

    const rowTop = y + 62;
    const rowHeight = Math.min(54, Math.max(40, (height - 82) / Math.max(1, gameState.standings.length)));
    gameState.standings.forEach((standing, index) => {
      const rowY = rowTop + index * rowHeight;
      const color = Phaser.Display.Color.HexStringToColor(standing.color).color;
      const row = this.add.graphics();
      row.fillStyle(color, index === 0 ? 0.9 : 0.42);
      row.fillRoundedRect(x + 14, rowY, width - 28, rowHeight - 8, 14);
      this.add.text(x + 28, rowY + 10, `${index + 1}. ${standing.name}`, {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "17px",
        color: index === 0 ? "#04111f" : "#ffffff"
      });
      const score = gameState.stage === "revealed" ? standing.projectedScore : standing.score;
      this.add.text(x + width - 92, rowY + 10, `${score} ${this.isEnglish() ? "pts" : "P"}`, {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "17px",
        color: index === 0 ? "#04111f" : "#facc15"
      });
    });
  }

  private renderRevealSequence(gameState: SchaetzoramaPublicState, width: number, height: number): void {
    const revealedAt = gameState.revealedAt ?? Date.now();
    const elapsed = Math.max(0, Date.now() - revealedAt);
    const stepIndex = Math.min(categoryOrder.length, Math.floor(elapsed / revealStepMs));

    if (stepIndex >= categoryOrder.length) {
      this.playChimeOnce(`${revealedAt}:final`, 4);
      this.renderFinalBoard(gameState, width, height);
      return;
    }

    const nextDelay = Math.max(500, revealedAt + (stepIndex + 1) * revealStepMs - Date.now());
    this.time.addEvent({
      delay: nextDelay,
      callback: () => this.redrawFromClient()
    });

    const categoryId = categoryOrder[stepIndex];
    this.playChimeOnce(`${revealedAt}:${categoryId}`, stepIndex);
    this.renderCategoryReveal(gameState, categoryId, stepIndex, width, height);
  }

  private renderCategoryReveal(
    gameState: SchaetzoramaPublicState,
    categoryId: SchaetzoramaCategoryId,
    stepIndex: number,
    width: number,
    height: number
  ): void {
    const question = gameState.roundContent.questions[categoryId];
    const accent = categoryAccent[categoryId];
    const leftWidth = width - 390;
    const top = 118;

    const panel = this.add.graphics();
    panel.fillStyle(0x020617, 0.68);
    panel.fillRoundedRect(36, top, leftWidth, height - top - 38, 26);
    panel.lineStyle(3, accent, 0.86);
    panel.strokeRoundedRect(36, top, leftWidth, height - top - 38, 26);

    this.renderRevealPips(64, top + 24, stepIndex);
    this.add.text(64, top + 58, `${this.categoryLabel(categoryId)}: ${question.title}`, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "28px",
      color: "#ffffff"
    });
    this.add.text(64, top + 98, question.prompt, {
      fontFamily: "Arial, sans-serif",
      fontSize: "22px",
      color: "#dbeafe",
      wordWrap: { width: leftWidth - 92 }
    });

    const solutionText = this.formatSolution(gameState, categoryId);
    const solution = this.add.text(64, top + 158, `${this.isEnglish() ? "Correct" : "Richtig"}: ${solutionText}`, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "34px",
      color: "#fef3c7",
      wordWrap: { width: leftWidth - 92 }
    });
    solution.setAlpha(0);
    solution.setScale(0.94);
    this.tweens.add({
      targets: solution,
      alpha: 1,
      scale: 1,
      duration: 360,
      ease: "Back.Out"
    });

    const entries = this.buildCategoryEntries(gameState, categoryId);
    this.add.text(66, top + 218, this.closestLine(gameState, categoryId, entries), {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "19px",
      color: "#bbf7d0",
      wordWrap: { width: leftWidth - 100 }
    });

    const rowTop = top + 262;
    const rowHeight = Math.min(54, Math.max(42, (height - rowTop - 58) / Math.max(1, entries.length)));
    entries.forEach((entry, index) => {
      this.time.addEvent({
        delay: 260 + index * 420,
        callback: () => this.renderRevealRow(entry, gameState, categoryId, 64, rowTop + index * rowHeight, leftWidth - 56, rowHeight - 8)
      });
    });

    this.renderScoreRail(gameState, width - 330, top, 292, height - top - 38);
  }

  private renderRevealPips(x: number, y: number, activeIndex: number): void {
    categoryOrder.forEach((categoryId, index) => {
      const graphics = this.add.graphics();
      graphics.fillStyle(categoryAccent[categoryId], index <= activeIndex ? 0.95 : 0.24);
      graphics.fillRoundedRect(x + index * 96, y, 82, 26, 12);
      this.add.text(x + index * 96 + 13, y + 6, this.categoryLabel(categoryId), {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "12px",
        color: index <= activeIndex ? "#06111f" : "#dbeafe"
      });
    });
  }

  private renderRevealRow(
    entry: CategoryEntry,
    gameState: SchaetzoramaPublicState,
    categoryId: SchaetzoramaCategoryId,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const container = this.add.container(x + 26, y);
    container.setAlpha(0);

    const color = Phaser.Display.Color.HexStringToColor(entry.result.color).color;
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.1);
    bg.fillRoundedRect(0, 0, width, height, 16);
    bg.lineStyle(2, color, 0.7);
    bg.strokeRoundedRect(0, 0, width, height, 16);
    container.add(bg);

    container.add(this.add.text(16, 10, entry.result.name, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "19px",
      color: "#ffffff"
    }));
    container.add(this.add.text(210, 11, entry.detail, {
      fontFamily: "Arial, sans-serif",
      fontSize: "17px",
      color: "#dbeafe",
      wordWrap: { width: width - 390 }
    }));

    const jokerLabel = this.jokerLabel(entry.result, categoryId);
    if (jokerLabel) {
      const badge = this.add.graphics();
      badge.fillStyle(0xfacc15, 0.92);
      badge.fillRoundedRect(width - 172, 9, 82, 28, 12);
      container.add(badge);
      container.add(this.add.text(width - 158, 15, jokerLabel, {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "12px",
        color: "#111827"
      }));
    }

    const points = this.add.text(width - 78, 7, `+${entry.score}`, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "26px",
      color: "#facc15"
    });
    container.add(points);

    this.tweens.add({
      targets: container,
      alpha: 1,
      x,
      duration: 380,
      ease: "Cubic.Out"
    });
    this.tweens.add({
      targets: points,
      scale: 1.22,
      yoyo: true,
      duration: 240,
      delay: 120,
      ease: "Back.Out"
    });

    this.renderSpark(x + width - 62, y + 26, categoryAccent[categoryId]);
    void gameState;
  }

  private renderSpark(x: number, y: number, color: number): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(3, color, 0.85);
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      graphics.lineBetween(x, y, x + Math.cos(angle) * 18, y + Math.sin(angle) * 18);
    }
    graphics.setAlpha(0);
    this.tweens.add({
      targets: graphics,
      alpha: 1,
      duration: 120,
      yoyo: true,
      ease: "Sine.Out"
    });
  }

  private renderFinalBoard(gameState: SchaetzoramaPublicState, width: number, height: number): void {
    const leftWidth = width - 390;
    const top = 118;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x020617, 0.7);
    graphics.fillRoundedRect(36, top, leftWidth, height - top - 38, 26);
    graphics.lineStyle(3, 0xfacc15, 0.78);
    graphics.strokeRoundedRect(36, top, leftWidth, height - top - 38, 26);

    this.add.text(64, top + 34, this.isEnglish() ? "Round Points" : "Rundenpunkte", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "34px",
      color: "#ffffff"
    });
    this.add.text(66, top + 78, this.isEnglish() ? "Press ready on the controllers when everyone has enjoyed the reveal." : "Controller bereit druecken, wenn alle die Auswertung genossen haben.", {
      fontFamily: "Arial, sans-serif",
      fontSize: "19px",
      color: "#dbeafe"
    });

    const sorted = [...gameState.results].sort((left, right) => right.total - left.total);
    const rowTop = top + 126;
    const rowHeight = Math.min(66, Math.max(48, (height - rowTop - 54) / Math.max(1, sorted.length)));

    sorted.forEach((result, index) => {
      const y = rowTop + index * rowHeight;
      const color = Phaser.Display.Color.HexStringToColor(result.color).color;
      const row = this.add.graphics();
      row.fillStyle(color, index === 0 ? 0.85 : 0.38);
      row.fillRoundedRect(64, y, leftWidth - 56, rowHeight - 10, 18);
      this.add.text(84, y + 13, `${index + 1}. ${result.name}`, {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "23px",
        color: index === 0 ? "#04111f" : "#ffffff"
      });
      this.add.text(340, y + 15, `${result.total} ${this.isEnglish() ? "round pts" : "Rundenpunkte"}`, {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "21px",
        color: index === 0 ? "#04111f" : "#fef3c7"
      });
      this.add.text(600, y + 17, this.compactScoreLine(result), {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        color: index === 0 ? "#082f49" : "#dbeafe",
        wordWrap: { width: Math.max(220, leftWidth - 650) }
      });
    });

    this.renderScoreRail(gameState, width - 330, top, 292, height - top - 38);
  }

  private buildCategoryEntries(gameState: SchaetzoramaPublicState, categoryId: SchaetzoramaCategoryId): CategoryEntry[] {
    const solution = gameState.solutions[categoryId];

    return [...gameState.results]
      .map((result) => {
        const answer = result.answers[categoryId];
        const score = result.categoryScores[categoryId];
        const sortValue = this.sortValueForCategory(solution, answer, score);

        return {
          result,
          answer,
          score,
          sortValue,
          detail: this.answerDetail(gameState, categoryId, answer, solution)
        };
      })
      .sort((left, right) => left.sortValue - right.sortValue || right.score - left.score || left.result.name.localeCompare(right.result.name));
  }

  private sortValueForCategory(solution: SchaetzoramaAnswer | undefined, answer: SchaetzoramaAnswer | undefined, score: number): number {
    if (solution?.kind === "number" && answer?.kind === "number") {
      return Math.abs(answer.value - solution.value);
    }

    return -score;
  }

  private closestLine(gameState: SchaetzoramaPublicState, categoryId: SchaetzoramaCategoryId, entries: CategoryEntry[]): string {
    const best = entries[0];

    if (!best) {
      return this.isEnglish() ? "No answers locked in." : "Keine Antworten eingeloggt.";
    }

    const tied = entries.filter((entry) => entry.sortValue === best.sortValue).map((entry) => entry.result.name).join(", ");
    const solution = gameState.solutions[categoryId];

    if (solution?.kind === "number") {
      const unit = gameState.roundContent.questions[categoryId].kind === "percent" ? "%" : "";
      return this.isEnglish()
        ? `Closest: ${tied} (${best.sortValue}${unit} off)`
        : `Am naechsten dran: ${tied} (${best.sortValue}${unit} daneben)`;
    }

    return this.isEnglish()
      ? `Best score: ${tied} (${best.score} points)`
      : `Beste Wertung: ${tied} (${best.score} Punkte)`;
  }

  private answerDetail(
    gameState: SchaetzoramaPublicState,
    categoryId: SchaetzoramaCategoryId,
    answer: SchaetzoramaAnswer | undefined,
    solution: SchaetzoramaAnswer | undefined
  ): string {
    if (!answer) {
      return this.isEnglish() ? "no answer" : "keine Antwort";
    }

    const base = this.formatAnswer(gameState, categoryId, answer, false);

    if (solution?.kind === "number" && answer.kind === "number") {
      const unit = gameState.roundContent.questions[categoryId].kind === "percent" ? "%" : "";
      return `${base} | ${this.isEnglish() ? "off by" : "Abstand"} ${Math.abs(answer.value - solution.value)}${unit}`;
    }

    return base;
  }

  private questionHint(question: SchaetzoramaPublicQuestion): string {
    if (question.kind === "number") {
      return this.isEnglish() ? "Controller: slider from 1 to 50." : "Controller: Schieber von 1 bis 50.";
    }
    if (question.kind === "percent") {
      return this.isEnglish() ? "Controller: percentage from 0 to 100." : "Controller: Prozent-Torte von 0 bis 100.";
    }
    if (question.kind === "rank") {
      return `Controller: ${question.directionLabel}.`;
    }
    if ("leftLabel" in question) {
      return this.isEnglish()
        ? `Controller: ${question.leftLabel}, ${question.rightLabel}, or both.`
        : `Controller: ${question.leftLabel}, ${question.rightLabel} oder beides.`;
    }
    return this.isEnglish() ? "Controller: assign." : "Controller: Zuordnen.";
  }

  private formatSolution(gameState: SchaetzoramaPublicState, categoryId: SchaetzoramaCategoryId): string {
    const solution = gameState.solutions[categoryId];
    return this.formatAnswer(gameState, categoryId, solution, true);
  }

  private formatAnswer(
    gameState: SchaetzoramaPublicState,
    categoryId: SchaetzoramaCategoryId,
    answer: SchaetzoramaAnswer | undefined,
    detailed: boolean
  ): string {
    const question = gameState.roundContent.questions[categoryId];

    if (!answer) {
      return "-";
    }

    if (answer.kind === "number") {
      return `${answer.value}${question.kind === "percent" ? "%" : ""}`;
    }

    if (answer.kind === "rank" && question.kind === "rank") {
      const rankQuestion = question as SchaetzoramaRankQuestion;
      return answer.order
        .map((itemId) => rankQuestion.items.find((item) => item.id === itemId)?.label ?? itemId)
        .join(" > ");
    }

    if (answer.kind === "assign" && question.kind === "assign") {
      const assignQuestion = question as SchaetzoramaAssignQuestion;
      if (!detailed) {
        const bothCount = Object.values(answer.assignments).filter((zone) => zone === "both").length;
        return this.isEnglish()
          ? `${Object.keys(answer.assignments).length} set, ${bothCount}x both`
          : `${Object.keys(answer.assignments).length} gesetzt, ${bothCount}x beides`;
      }
      return assignQuestion.terms
        .map((term) => {
          const zone = answer.assignments[term.id];
        const label = zone === "left" ? assignQuestion.leftLabel : zone === "right" ? assignQuestion.rightLabel : this.isEnglish() ? "Both" : "Beides";
          return `${term.label}: ${label}`;
        })
        .join(" | ");
    }

    return "-";
  }

  private jokerLabel(result: SchaetzoramaPlayerRoundResult, categoryId: SchaetzoramaCategoryId): string | null {
    if (result.joker?.categoryId !== categoryId) {
      return null;
    }

    return this.isEnglish() ? "Copied" : "Abschreiben";
  }

  private compactScoreLine(result: SchaetzoramaPlayerRoundResult): string {
    return categoryOrder
      .map((categoryId) => `${this.categoryLabel(categoryId)} +${result.categoryScores[categoryId]}`)
      .join("  ");
  }

  private playChimeOnce(key: string, stepIndex: number): void {
    if (this.lastChimeKey === key) {
      return;
    }

    this.lastChimeKey = key;
    this.playChime(stepIndex);
  }

  private playChime(stepIndex: number): void {
    try {
      const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
      const AudioContextClass = window.AudioContext ?? audioWindow.webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const context = new AudioContextClass();
      void context.resume();
      const now = context.currentTime;
      const notes = [392, 494, 587, 659, 784].slice(stepIndex, stepIndex + 3);

      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, now + index * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.07, now + index * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.18);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + index * 0.09);
        oscillator.stop(now + index * 0.09 + 0.2);
      });

      window.setTimeout(() => {
        void context.close();
      }, 650);
    } catch {
      // Audio is optional; browsers may block it until the host page has a gesture.
    }
  }

  private centerText(text: string, width: number, height: number): void {
    const label = this.add.text(width / 2, height / 2, text, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "34px",
      color: "#ffffff"
    });
    label.setOrigin(0.5);
  }
}
