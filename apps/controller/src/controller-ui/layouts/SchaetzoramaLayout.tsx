import { useEffect, useMemo, useState } from "react";
import type {
  SchaetzoramaAnswerSet,
  SchaetzoramaAssignQuestion,
  SchaetzoramaAssignmentZone,
  SchaetzoramaCategoryId,
  SchaetzoramaNumberQuestion,
  SchaetzoramaPublicQuestion,
  SchaetzoramaRankQuestion
} from "@open-party-lab/protocol";
import type { SchaetzoramaLayoutModel } from "./models.js";
import { ReadyPanel } from "../common/ReadyPanel.js";

interface SchaetzoramaLayoutProps {
  model: SchaetzoramaLayoutModel;
}

type JokerDraft = {
  kind: "copy" | "none";
  categoryId: SchaetzoramaCategoryId;
  targetPlayerId: string;
};

const categoryOrder: SchaetzoramaCategoryId[] = ["number", "percent", "rank", "assign"];

export function SchaetzoramaLayout({ model }: SchaetzoramaLayoutProps) {
  const en = model.language === "en";
  const initialAnswers = useMemo(() => buildInitialAnswers(model), [model]);
  const initialJoker = useMemo(() => buildInitialJoker(model), [model]);
  const [answers, setAnswers] = useState<SchaetzoramaAnswerSet>(initialAnswers);
  const [jokerDraft, setJokerDraft] = useState<JokerDraft>(initialJoker);

  useEffect(() => {
    setAnswers(initialAnswers);
    setJokerDraft(initialJoker);
  }, [initialAnswers, initialJoker, model.resetKey]);

  if (!model.roundContent) {
    return <p style={{ margin: 0, color: "var(--text-muted)" }}>{en ? "The quiz panel is warming up." : "Das Quiz-Pult wird aufgewarmt."}</p>;
  }

  const answered = Object.keys(model.ownAnswers).length > 0;
  const canSubmit = model.canSubmitAnswers;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <header style={headerStyle}>
        <div>
          <strong style={{ display: "block", fontSize: "1.2rem" }}>{model.title}</strong>
          <span style={subtleTextStyle}>{model.roundContent.roundLabel} | {model.subtitle}</span>
        </div>
        <span style={timerPillStyle}>{formatTimer(model)}</span>
      </header>

      <LeaderboardStrip model={model} />

      {model.helperText ? <p style={helperStyle}>{model.helperText}</p> : null}

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      {model.stage === "revealed" ? (
        <ResultView model={model} />
      ) : model.stage === "joker" ? (
        <CopyReviewView model={model} draft={jokerDraft} onDraftChange={setJokerDraft} />
      ) : (
        <>
          <div style={questionGridStyle}>
            {categoryOrder.map((categoryId) => (
              <QuestionEditor
                key={categoryId}
                question={model.roundContent!.questions[categoryId]}
                answer={answers[categoryId]}
                language={model.language}
                disabled={answered || !model.canSubmitAnswers}
                onChange={(answer) => setAnswers((current) => ({ ...current, [categoryId]: answer }))}
              />
            ))}
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => model.onSubmitAnswers(answers)}
            style={{
              ...primaryButtonStyle,
              opacity: canSubmit ? 1 : 0.55
            }}
          >
            {answered ? en ? "Panel locked" : "Pult verriegelt" : en ? "Lock in panel" : "Pult einloggen"}
          </button>
        </>
      )}

      <ProgressStrip model={model} />
    </div>
  );
}

function QuestionEditor({
  question,
  answer,
  language,
  disabled,
  onChange
}: {
  question: SchaetzoramaPublicQuestion;
  answer: SchaetzoramaAnswerSet[SchaetzoramaCategoryId];
  language: SchaetzoramaLayoutModel["language"];
  disabled: boolean;
  onChange: (answer: NonNullable<SchaetzoramaAnswerSet[SchaetzoramaCategoryId]>) => void;
}) {
  const body = renderQuestionBody(question, answer, language, disabled, onChange);

  return (
    <section style={panelStyle(question.categoryId)}>
      <PanelHeading question={question} />
      <p style={questionTextStyle}>{question.prompt}</p>
      {body}
    </section>
  );
}

function renderQuestionBody(
  question: SchaetzoramaPublicQuestion,
  answer: SchaetzoramaAnswerSet[SchaetzoramaCategoryId],
  language: SchaetzoramaLayoutModel["language"],
  disabled: boolean,
  onChange: (answer: NonNullable<SchaetzoramaAnswerSet[SchaetzoramaCategoryId]>) => void
) {
  const en = language === "en";

  if (question.kind === "number" || question.kind === "percent") {
    const numericQuestion = question as SchaetzoramaNumberQuestion;
    const value = answer?.kind === "number" ? answer.value : Math.round((numericQuestion.min + numericQuestion.max) / 2);

    return (
      <div style={{ display: "grid", gap: 10 }}>
        <input
          type="range"
          min={numericQuestion.min}
          max={numericQuestion.max}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange({ kind: "number", value: Number(event.currentTarget.value) })}
        />
        <label style={numberInputWrapStyle}>
          <span>{question.kind === "percent" ? en ? "Percent" : "Prozent" : en ? "Number" : "Zahl"}</span>
          <input
            type="number"
            min={numericQuestion.min}
            max={numericQuestion.max}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange({ kind: "number", value: Number(event.currentTarget.value) })}
            style={numberInputStyle}
          />
        </label>
      </div>
    );
  }

  if (question.kind === "rank") {
    const rankQuestion = question as SchaetzoramaRankQuestion;
    const order = answer?.kind === "rank" ? answer.order : rankQuestion.items.map((item) => item.id);

    return (
      <div style={{ display: "grid", gap: 8 }}>
        {order.map((itemId, index) => {
          const item = rankQuestion.items.find((entry) => entry.id === itemId) ?? rankQuestion.items[index];
          return (
            <div key={itemId} style={rankRowStyle}>
              <strong>{index + 1}</strong>
              <span>{item.label}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  disabled={disabled}
                  style={miniButtonStyle}
                  onClick={() => onChange({ kind: "rank", order: move(order, index, -1) })}
                >
                  {en ? "Up" : "Hoch"}
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  style={miniButtonStyle}
                  onClick={() => onChange({ kind: "rank", order: move(order, index, 1) })}
                >
                  {en ? "Down" : "Runter"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const assignQuestion = question as SchaetzoramaAssignQuestion;
  const assignments =
    answer?.kind === "assign"
      ? answer.assignments
      : Object.fromEntries(assignQuestion.terms.map((term) => [term.id, "left" as SchaetzoramaAssignmentZone]));

  return (
    <>
      <div style={assignLegendStyle}>
        <span>{assignQuestion.leftLabel}</span>
        <span>{en ? "Both" : "Beides"}</span>
        <span>{assignQuestion.rightLabel}</span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {assignQuestion.terms.map((term) => (
          <div key={term.id} style={assignRowStyle}>
            <strong>{term.label}</strong>
            <div style={segmentedStyle}>
              {(["left", "both", "right"] as SchaetzoramaAssignmentZone[]).map((zone) => (
                <button
                  key={zone}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      kind: "assign",
                      assignments: {
                        ...assignments,
                        [term.id]: zone
                      }
                    })
                  }
                  style={{
                    ...segmentButtonStyle,
                    background: assignments[term.id] === zone ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.12)",
                    color: assignments[term.id] === zone ? "#111827" : "#f8fafc"
                  }}
                >
                  {zoneLabel(zone, language)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CopyReviewView({
  model,
  draft,
  onDraftChange
}: {
  model: SchaetzoramaLayoutModel;
  draft: JokerDraft;
  onDraftChange: (draft: JokerDraft) => void;
}) {
  const en = model.language === "en";
  const preview = model.ownJokerPreview;
  const categoryId = preview?.categoryId ?? draft.categoryId;
  const targetPlayerId = preview?.targetPlayerId ?? (draft.targetPlayerId || (model.copyTargets[0]?.playerId ?? ""));
  const target = model.copyTargets.find((entry) => entry.playerId === targetPlayerId) ?? model.copyTargets[0];
  const ownAnswer = model.ownAnswers[categoryId];
  const targetAnswer = preview ? target?.answers?.[categoryId] : undefined;
  const copyUsesLeft = model.ownInventory.copy;
  const canChoosePreview = model.canSubmitJoker && !preview && copyUsesLeft > 0 && Boolean(target?.playerId);
  const canCopy = model.canSubmitJoker && Boolean(preview) && Boolean(target?.playerId);

  if (!model.canSubmitJoker) {
    return (
      <section style={copyPanelStyle}>
        <strong>{en ? "Copy" : "Abschreiben"}</strong>
        <p style={helperStyle}>{en ? "Choice locked. Waiting for the other panels." : "Entscheidung eingeloggt. Warte auf die anderen Pulte."}</p>
      </section>
    );
  }

  if (!preview && (copyUsesLeft <= 0 || model.copyTargets.length === 0)) {
    return (
      <section style={copyPanelStyle}>
        <strong>{en ? "Copy" : "Abschreiben"}</strong>
        <p style={helperStyle}>
          {copyUsesLeft <= 0
            ? en ? "No copy uses left. Keep your own answers for this round." : "Du hast kein Abschreiben mehr uebrig. Diese Runde bleiben deine Antworten."
            : en ? "No other panel is available to copy from." : "Es gibt kein anderes Pult zum Abschreiben."}
        </p>
        <button type="button" onClick={() => model.onChooseJoker(null)} style={secondaryActionStyle}>
          {en ? "Keep mine" : "Eigene behalten"}
        </button>
      </section>
    );
  }

  return (
    <section style={copyPanelStyle}>
      <strong>{en ? `Copy (${copyUsesLeft} left)` : `Abschreiben (${copyUsesLeft} uebrig)`}</strong>
      {!preview ? (
        <>
          <p style={helperStyle}>{en ? "Choose exactly one player and one task. The answer is revealed after you lock this choice." : "Waehle genau eine Person und eine Aufgabe. Erst danach wird diese Antwort sichtbar."}</p>
          <div style={copySelectGridStyle}>
            <label style={selectLabelStyle}>
              {en ? "Task" : "Aufgabe"}
              <select
                value={categoryId}
                onChange={(event) => onDraftChange({ ...draft, kind: "copy", categoryId: event.currentTarget.value as SchaetzoramaCategoryId, targetPlayerId })}
                style={selectStyle}
              >
                {categoryOrder.map((entry) => (
                  <option key={entry} value={entry}>
                    {model.categoryLabels[entry]}
                  </option>
                ))}
              </select>
            </label>
            <label style={selectLabelStyle}>
              {en ? "From whom?" : "Bei wem?"}
              <select
                value={targetPlayerId}
                onChange={(event) => onDraftChange({ ...draft, kind: "copy", categoryId, targetPlayerId: event.currentTarget.value })}
                style={selectStyle}
              >
                {model.copyTargets.map((entry) => (
                  <option key={entry.playerId} value={entry.playerId}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={copyButtonGridStyle}>
            <button type="button" onClick={() => model.onChooseJoker(null)} style={secondaryActionStyle}>
              {en ? "Skip copy" : "Nicht abschreiben"}
            </button>
            <button
              type="button"
              disabled={!canChoosePreview}
              onClick={() =>
                target &&
                model.onPreviewJoker({
                  kind: "copy",
                  categoryId,
                  targetPlayerId: target.playerId
                })
              }
              style={{
                ...primaryButtonStyle,
                opacity: canChoosePreview ? 1 : 0.5
              }}
            >
              {en ? "Reveal this answer" : "Diese Antwort ansehen"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={helperStyle}>
            {en
              ? `${target?.name ?? "Other"} on ${model.categoryLabels[categoryId]} is revealed. Decide now.`
              : `${target?.name ?? "Andere"} bei ${model.categoryLabels[categoryId]} ist sichtbar. Entscheide jetzt.`}
          </p>
          <div style={answerCompareGridStyle}>
            <AnswerPreview title={en ? "Your answer" : "Deine Antwort"} text={formatControllerAnswer(model, categoryId, ownAnswer)} />
            <AnswerPreview title={`${target?.name ?? (en ? "Other" : "Andere")} ${en ? "answer" : "Antwort"}`} text={formatControllerAnswer(model, categoryId, targetAnswer)} />
          </div>
          <div style={copyButtonGridStyle}>
            <button type="button" onClick={() => model.onChooseJoker(null)} style={secondaryActionStyle}>
              {en ? "Keep mine" : "Eigene behalten"}
            </button>
            <button
              type="button"
              disabled={!canCopy}
              onClick={() =>
                preview &&
                model.onChooseJoker({
                  kind: "copy",
                  categoryId: preview.categoryId,
                  targetPlayerId: preview.targetPlayerId
                })
              }
              style={{
                ...primaryButtonStyle,
                opacity: canCopy ? 1 : 0.5
              }}
            >
              {en ? "Copy answer" : "Abschreiben"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function AnswerPreview({ title, text }: { title: string; text: string }) {
  return (
    <div style={answerPreviewStyle}>
      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem" }}>{title}</span>
      <strong>{text}</strong>
    </div>
  );
}

function ResultView({ model }: { model: SchaetzoramaLayoutModel }) {
  const en = model.language === "en";
  const sorted = [...model.results].sort((left, right) => right.total - left.total);

  return (
    <section style={resultsPanelStyle}>
      <strong>{en ? "Round score" : "Rundenwertung"}</strong>
      <div style={{ display: "grid", gap: 8 }}>
        {sorted.map((result, index) => (
          <div key={result.playerId} style={resultRowStyle}>
            <span>{index + 1}. {result.name}</span>
            <strong>{result.total} {en ? "pts" : "P"}</strong>
          </div>
        ))}
      </div>
      <div style={solutionGridStyle}>
        {categoryOrder.map((categoryId) => (
          <div key={categoryId} style={solutionPillStyle}>
            <span>{model.categoryLabels[categoryId]}</span>
            <strong>{formatSolution(model, categoryId)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function LeaderboardStrip({ model }: { model: SchaetzoramaLayoutModel }) {
  const en = model.language === "en";
  if (model.standings.length === 0) {
    return null;
  }

  return (
    <div style={leaderboardStyle}>
      {model.standings.slice(0, 4).map((standing, index) => (
        <span key={standing.playerId} style={{ ...leaderboardPillStyle, borderColor: standing.color }}>
          {index + 1}. {standing.name} {standing.projectedScore} {en ? "pts" : "P"}
        </span>
      ))}
    </div>
  );
}

function ProgressStrip({ model }: { model: SchaetzoramaLayoutModel }) {
  return (
    <div style={progressStyle}>
      {model.progress.map((player) => {
        const done = model.stage === "joker" ? player.jokerReady : player.answered;

        return (
          <span
            key={player.playerId}
            style={{
              ...progressDotStyle,
              borderColor: player.color,
              opacity: done ? 1 : 0.42
            }}
          >
            {player.name}
          </span>
        );
      })}
    </div>
  );
}

function PanelHeading({ question }: { question: SchaetzoramaPublicQuestion }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <strong>{question.shortLabel}</strong>
      <span style={{ fontSize: "0.8rem", opacity: 0.76 }}>{question.title}</span>
    </div>
  );
}

function buildInitialAnswers(model: SchaetzoramaLayoutModel): SchaetzoramaAnswerSet {
  if (!model.roundContent) {
    return {};
  }

  return {
    number:
      model.ownAnswers.number ??
      ({
        kind: "number",
        value: 25
      } as const),
    percent:
      model.ownAnswers.percent ??
      ({
        kind: "number",
        value: 50
      } as const),
    rank:
      model.ownAnswers.rank ??
      ({
        kind: "rank",
        order: (model.roundContent.questions.rank as SchaetzoramaRankQuestion).items.map((item) => item.id)
      } as const),
    assign:
      model.ownAnswers.assign ??
      ({
        kind: "assign",
        assignments: Object.fromEntries((model.roundContent.questions.assign as SchaetzoramaAssignQuestion).terms.map((term) => [term.id, "left"]))
      } as const)
  };
}

function buildInitialJoker(model: SchaetzoramaLayoutModel): JokerDraft {
  const ownJoker = model.ownJokerPreview ?? model.ownJoker;

  if (!ownJoker) {
    return {
      kind: "none",
      categoryId: "number",
      targetPlayerId: model.copyTargets[0]?.playerId ?? ""
    };
  }

  return {
    kind: "copy",
    categoryId: ownJoker.categoryId,
    targetPlayerId: ownJoker.targetPlayerId ?? model.copyTargets[0]?.playerId ?? ""
  };
}

function move(order: string[], index: number, offset: number): string[] {
  const target = index + offset;

  if (target < 0 || target >= order.length) {
    return order;
  }

  const next = [...order];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function zoneLabel(zone: SchaetzoramaAssignmentZone, language: SchaetzoramaLayoutModel["language"]): string {
  if (language === "en") {
    return zone === "left" ? "Left" : zone === "right" ? "Right" : "Both";
  }

  return zone === "left" ? "Links" : zone === "right" ? "Rechts" : "Beides";
}

function formatTimer(model: SchaetzoramaLayoutModel): string {
  const end = model.stage === "joker" ? model.jokerEndsAt : model.answerEndsAt;

  if (!end || model.stage === "revealed") {
    return model.stage === "revealed"
      ? (model.language === "en" ? "Reveal" : "Auswertung")
      : (model.language === "en" ? "No limit" : "Ohne Limit");
  }

  const seconds = Math.max(0, Math.ceil((end - Date.now()) / 1000));
  return `${seconds}s`;
}

function formatSolution(model: SchaetzoramaLayoutModel, categoryId: SchaetzoramaCategoryId): string {
  const solution = model.solutions[categoryId];
  const question = model.roundContent?.questions[categoryId];

  if (!solution || !question) {
    return "?";
  }

  if (solution.kind === "number") {
    return `${solution.value}${question.kind === "percent" ? "%" : ""}`;
  }

  if (solution.kind === "rank" && question.kind === "rank") {
    return solution.order
      .map((itemId) => question.items.find((item) => item.id === itemId)?.label ?? itemId)
      .join(" > ");
  }

  if (solution.kind === "assign" && question.kind === "assign") {
    return question.terms
      .map((term) => `${term.label}: ${solution.assignments[term.id] === "left" ? question.leftLabel : solution.assignments[term.id] === "right" ? question.rightLabel : model.language === "en" ? "Both" : "Beides"}`)
      .join(" | ");
  }

  return "?";
}

function formatControllerAnswer(
  model: SchaetzoramaLayoutModel,
  categoryId: SchaetzoramaCategoryId,
  answer: SchaetzoramaAnswerSet[SchaetzoramaCategoryId]
): string {
  const question = model.roundContent?.questions[categoryId];

  if (!answer || !question) {
    return "-";
  }

  if (answer.kind === "number") {
    return `${answer.value}${question.kind === "percent" ? "%" : ""}`;
  }

  if (answer.kind === "rank" && question.kind === "rank") {
    return answer.order
      .map((itemId) => question.items.find((item) => item.id === itemId)?.label ?? itemId)
      .join(" > ");
  }

  if (answer.kind === "assign" && question.kind === "assign") {
    return question.terms
      .map((term) => {
        const zone = answer.assignments[term.id];
        const label = zone === "left" ? question.leftLabel : zone === "right" ? question.rightLabel : model.language === "en" ? "Both" : "Beides";
        return `${term.label}: ${label}`;
      })
      .join(" | ");
  }

  return "-";
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  padding: 14,
  borderRadius: 14,
  background: "linear-gradient(135deg, rgba(236, 72, 153, 0.86), rgba(14, 165, 233, 0.86) 52%, rgba(250, 204, 21, 0.86))",
  color: "#fff"
} as const;

const subtleTextStyle = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "0.92rem"
} as const;

const timerPillStyle = {
  minWidth: 64,
  textAlign: "center",
  padding: "8px 10px",
  borderRadius: 999,
  background: "rgba(2, 6, 23, 0.32)",
  fontWeight: 800
} as const;

const helperStyle = {
  margin: 0,
  color: "var(--text-muted)",
  lineHeight: 1.4
} as const;

const questionGridStyle = {
  display: "grid",
  gap: 12
} as const;

const colorByCategory: Record<SchaetzoramaCategoryId, string> = {
  number: "rgba(34, 197, 94, 0.72)",
  percent: "rgba(59, 130, 246, 0.72)",
  rank: "rgba(236, 72, 153, 0.72)",
  assign: "rgba(249, 115, 22, 0.72)"
};

function panelStyle(categoryId: SchaetzoramaCategoryId) {
  return {
    display: "grid",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    background: `linear-gradient(135deg, ${colorByCategory[categoryId]}, rgba(15, 23, 42, 0.84))`
  } as const;
}

const questionTextStyle = {
  margin: 0,
  lineHeight: 1.35,
  color: "rgba(255,255,255,0.92)"
} as const;

const numberInputWrapStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "8px 10px",
  borderRadius: 12,
  background: "rgba(2, 6, 23, 0.24)"
} as const;

const numberInputStyle = {
  width: 92,
  border: "none",
  borderRadius: 10,
  padding: "10px 12px",
  fontWeight: 800,
  fontSize: "1.05rem"
} as const;

const rankRowStyle = {
  display: "grid",
  gridTemplateColumns: "28px 1fr auto",
  alignItems: "center",
  gap: 10,
  padding: 10,
  borderRadius: 12,
  background: "rgba(2, 6, 23, 0.24)"
} as const;

const miniButtonStyle = {
  minWidth: 54,
  minHeight: 38,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.24)",
  background: "rgba(255,255,255,0.13)",
  color: "#fff",
  fontWeight: 800
} as const;

const assignLegendStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 6,
  color: "rgba(255,255,255,0.74)",
  fontSize: "0.78rem",
  textAlign: "center"
} as const;

const assignRowStyle = {
  display: "grid",
  gap: 8,
  padding: 10,
  borderRadius: 12,
  background: "rgba(2, 6, 23, 0.24)"
} as const;

const segmentedStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 6
} as const;

const segmentButtonStyle = {
  minHeight: 38,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.2)",
  fontWeight: 800
} as const;

const primaryButtonStyle = {
  minHeight: 54,
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, #facc15, #fb7185 48%, #38bdf8)",
  color: "#111827",
  fontWeight: 900,
  fontSize: "1rem"
} as const;

const selectLabelStyle = {
  display: "grid",
  gap: 6,
  color: "rgba(255,255,255,0.82)"
} as const;

const selectStyle = {
  minHeight: 44,
  borderRadius: 12,
  border: "none",
  padding: "0 12px",
  fontWeight: 800
} as const;

const copyPanelStyle = {
  display: "grid",
  gap: 12,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "linear-gradient(135deg, rgba(14, 165, 233, 0.58), rgba(124, 58, 237, 0.56), rgba(249, 115, 22, 0.46))"
} as const;

const copySelectGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10
} as const;

const answerCompareGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10
} as const;

const answerPreviewStyle = {
  display: "grid",
  gap: 6,
  minHeight: 88,
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(2, 6, 23, 0.3)",
  color: "#ffffff"
} as const;

const copyButtonGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10
} as const;

const secondaryActionStyle = {
  minHeight: 54,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.26)",
  background: "rgba(255,255,255,0.12)",
  color: "#ffffff",
  fontWeight: 900,
  fontSize: "1rem"
} as const;

const resultsPanelStyle = {
  display: "grid",
  gap: 12,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "linear-gradient(135deg, rgba(34, 197, 94, 0.44), rgba(14, 165, 233, 0.42), rgba(244, 114, 182, 0.38))"
} as const;

const resultRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(2, 6, 23, 0.3)"
} as const;

const solutionGridStyle = {
  display: "grid",
  gap: 8
} as const;

const solutionPillStyle = {
  display: "grid",
  gap: 4,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.11)"
} as const;

const leaderboardStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8
} as const;

const leaderboardPillStyle = {
  border: "2px solid",
  borderRadius: 999,
  padding: "7px 10px",
  background: "rgba(15, 23, 42, 0.54)",
  color: "var(--text-main)",
  fontSize: "0.84rem",
  fontWeight: 800
} as const;

const progressStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8
} as const;

const progressDotStyle = {
  border: "2px solid",
  borderRadius: 999,
  padding: "6px 9px",
  background: "rgba(15, 23, 42, 0.58)",
  color: "var(--text-main)",
  fontSize: "0.82rem"
} as const;
