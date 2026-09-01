import { useEffect, useMemo, useState } from "react";
import type { SchaetzoramaAnswerSet, SchaetzoramaAssignQuestion, SchaetzoramaAssignmentZone, SchaetzoramaCategoryId, SchaetzoramaNumberQuestion, SchaetzoramaPublicQuestion, SchaetzoramaRankQuestion } from "@open-party-lab/protocol";
import type { SchaetzoramaLayoutModel } from "./models.js";
import { ReadyPanel } from "../common/ReadyPanel.js";
import "./SchaetzoramaLayout.css";

interface Props { model: SchaetzoramaLayoutModel }
type JokerDraft = { categoryId: SchaetzoramaCategoryId; targetPlayerId: string };
const categories: SchaetzoramaCategoryId[] = ["number", "percent", "rank", "assign"];

export function SchaetzoramaLayout({ model }: Props) {
  const initial = useMemo(() => initialAnswers(model), [model]);
  const [answers, setAnswers] = useState<SchaetzoramaAnswerSet>(initial);
  const [active, setActive] = useState<SchaetzoramaCategoryId>("number");
  const [reviewed, setReviewed] = useState<Set<SchaetzoramaCategoryId>>(new Set());
  const [joker, setJoker] = useState<JokerDraft>(() => initialJoker(model));

  useEffect(() => {
    setAnswers(initial);
    setActive("number");
    setReviewed(new Set(Object.keys(model.ownAnswers) as SchaetzoramaCategoryId[]));
    setJoker(initialJoker(model));
  }, [initial, model.resetKey]);

  if (!model.roundContent) {
    return <p className="szc-empty">{model.language === "en" ? "The quiz panel is warming up." : "Das Quiz-Pult wird vorbereitet."}</p>;
  }

  const en = model.language === "en";
  const locked = Object.keys(model.ownAnswers).length > 0;
  const index = categories.indexOf(active);
  const canLock = categories.slice(0, -1).every((category) => reviewed.has(category));
  const finishStep = () => {
    const done = new Set(reviewed).add(active);
    setReviewed(done);
    const target = categories.find((category, position) => position > index && !done.has(category));
    if (target) setActive(target);
  };

  return <div className="szc-shell">
    <header className="szc-header">
      <div><span className="szc-kicker">{model.roundContent.roundLabel}</span><strong>{stageTitle(model)}</strong></div>
      <span className="szc-limit">{en ? "No timer" : "Ohne Zeitlimit"}</span>
    </header>
    {model.ready ? <ReadyPanel ready={model.ready} /> : null}
    {model.stage === "revealed" ? <ResultView model={model} /> : model.stage === "joker" ? <CopyView model={model} draft={joker} onDraftChange={setJoker} /> : locked ? <LockedView model={model} /> : <>
      <nav className="szc-tabs" aria-label={en ? "Questions" : "Fragen"}>
        {categories.map((category, position) => <button key={category} type="button" className={`szc-tab szc-${category}${active === category ? " is-active" : ""}${reviewed.has(category) ? " is-done" : ""}`} onClick={() => setActive(category)} aria-label={`${position + 1}. ${model.categoryLabels[category]}`}><span>{glyph(category)}</span><small>{position + 1}</small></button>)}
      </nav>
      <Question question={model.roundContent.questions[active]} answer={answers[active]} language={model.language} disabled={!model.canSubmitAnswers} onChange={(answer) => setAnswers((current) => ({ ...current, [active]: answer }))} />
      <div className="szc-actions">
        {index > 0 ? <button type="button" className="szc-button szc-button-secondary" onClick={() => setActive(categories[index - 1])}>← {en ? "Back" : "Zurück"}</button> : <span />}
        {index < 3 ? <button type="button" className="szc-button szc-button-primary" onClick={finishStep}>{en ? "Done" : "Fertig"} →</button> : <button type="button" className="szc-button szc-button-submit" disabled={!model.canSubmitAnswers || !canLock} onClick={() => model.onSubmitAnswers(answers)}>{en ? "Lock answers" : "Antworten einloggen"}</button>}
      </div>
      {!canLock && index === 3 ? <p className="szc-note">{en ? "Complete questions 1 to 3 before locking in." : "Schließe die Fragen 1 bis 3 ab, bevor du einloggst."}</p> : null}
    </>}
    <Progress model={model} />
  </div>;
}

function Question({ question, answer, language, disabled, onChange }: { question: SchaetzoramaPublicQuestion; answer: SchaetzoramaAnswerSet[SchaetzoramaCategoryId]; language: SchaetzoramaLayoutModel["language"]; disabled: boolean; onChange: (answer: NonNullable<SchaetzoramaAnswerSet[SchaetzoramaCategoryId]>) => void }) {
  return <section className={`szc-question szc-${question.categoryId}`}>
    <div className="szc-question-head"><span className="szc-question-icon">{glyph(question.categoryId)}</span><div><span>{question.shortLabel}</span><strong>{question.title}</strong></div></div>
    <h2>{question.prompt}</h2>
    {questionControl(question, answer, language, disabled, onChange)}
  </section>;
}

function questionControl(question: SchaetzoramaPublicQuestion, answer: SchaetzoramaAnswerSet[SchaetzoramaCategoryId], language: SchaetzoramaLayoutModel["language"], disabled: boolean, onChange: (answer: NonNullable<SchaetzoramaAnswerSet[SchaetzoramaCategoryId]>) => void) {
  const en = language === "en";
  if (question.kind === "number" || question.kind === "percent") {
    const value = answer?.kind === "number" ? answer.value : Math.round((question.min + question.max) / 2);
    const progress = ((value - question.min) / Math.max(1, question.max - question.min)) * 100;
    const unit = question.unitLabel ?? (question.kind === "percent" ? "%" : "");
    return <div className="szc-number-control">
      {question.kind === "percent" ? <div className="szc-percent-ring" style={{ "--value": `${progress}%` } as React.CSSProperties}><strong>{value}<small>%</small></strong></div> : <div className="szc-number-readout"><strong>{value}</strong><span>{unit}</span></div>}
      <input className="szc-range" type="range" min={question.min} max={question.max} value={value} disabled={disabled} onChange={(event) => onChange({ kind: "number", value: Number(event.currentTarget.value) })}/>
      <div className="szc-range-labels"><span>{question.min}</span><span>{question.max}{unit ? ` ${unit}` : ""}</span></div>
      <div className="szc-stepper"><button type="button" disabled={disabled || value <= question.min} aria-label={en ? "Decrease" : "Verringern"} onClick={() => onChange({ kind: "number", value: Math.max(question.min, value - 1) })}>−</button><input type="number" min={question.min} max={question.max} value={value} disabled={disabled} aria-label={en ? "Estimate" : "Schätzwert"} onChange={(event) => onChange({ kind: "number", value: clamp(Number(event.currentTarget.value), question.min, question.max) })}/><button type="button" disabled={disabled || value >= question.max} aria-label={en ? "Increase" : "Erhöhen"} onClick={() => onChange({ kind: "number", value: Math.min(question.max, value + 1) })}>+</button></div>
    </div>;
  }

  if (question.kind === "rank") {
    const order = answer?.kind === "rank" ? answer.order : question.items.map((item) => item.id);
    return <div className="szc-rank-control"><p className="szc-direction">{question.directionLabel}</p>{order.map((id, position) => {
      const item = question.items.find((entry) => entry.id === id) ?? question.items[position];
      return <div className="szc-rank-row" key={id}><b>{position + 1}</b><span>{item.label}</span><div><button type="button" disabled={disabled || position === 0} aria-label={en ? "Move up" : "Nach oben"} onClick={() => onChange({ kind: "rank", order: move(order, position, -1) })}>↑</button><button type="button" disabled={disabled || position === order.length - 1} aria-label={en ? "Move down" : "Nach unten"} onClick={() => onChange({ kind: "rank", order: move(order, position, 1) })}>↓</button></div></div>;
    })}</div>;
  }

  if (question.kind === "assign") {
    const assignments = answer?.kind === "assign" ? answer.assignments : Object.fromEntries(question.terms.map((term) => [term.id, "left" as const]));
    return <div className="szc-assign-control"><div className="szc-venn"><i>{question.leftLabel}</i><b>{en ? "Both" : "Beide"}</b><i>{question.rightLabel}</i></div>{question.terms.map((term) => <div className="szc-assign-row" key={term.id}><strong>{term.label}</strong><div>{(["left", "both", "right"] as SchaetzoramaAssignmentZone[]).map((zone) => <button type="button" key={zone} disabled={disabled} className={assignments[term.id] === zone ? "is-selected" : ""} aria-label={`${term.label}: ${zoneLabel(zone, question, language)}`} onClick={() => onChange({ kind: "assign", assignments: { ...assignments, [term.id]: zone } })}>{zone === "left" ? "L" : zone === "right" ? "R" : "∩"}</button>)}</div></div>)}</div>;
  }
  return null;
}

function LockedView({ model }: { model: SchaetzoramaLayoutModel }) {
  const en = model.language === "en";
  const waiting = model.progress.filter((player) => !player.answered).length;
  return <section className="szc-status"><span>✓</span><h2>{en ? "Answers locked" : "Antworten eingeloggt"}</h2><p>{waiting ? (en ? `Waiting for ${waiting} more.` : `Noch ${waiting} fehlen.`) : (en ? "Everyone is ready." : "Alle sind bereit.")}</p></section>;
}

function CopyView({ model, draft, onDraftChange }: { model: SchaetzoramaLayoutModel; draft: JokerDraft; onDraftChange: (draft: JokerDraft) => void }) {
  const en = model.language === "en";
  const preview = model.ownJokerPreview;
  const categoryId = preview?.categoryId ?? draft.categoryId;
  const targetId = preview?.targetPlayerId ?? draft.targetPlayerId;
  const target = model.copyTargets.find((player) => player.playerId === targetId) ?? model.copyTargets[0];
  if (!model.canSubmitJoker) return <section className="szc-status"><span>✓</span><h2>{en ? "Decision locked" : "Entscheidung eingeloggt"}</h2></section>;
  if (model.ownInventory.copy <= 0 || !target) return <section className="szc-copy"><h2>{en ? "Keep your answers" : "Eigene Antworten behalten"}</h2><p>{en ? "No copy is available this round." : "In dieser Runde ist kein Abschreiben verfügbar."}</p><button className="szc-button szc-button-primary" onClick={() => model.onChooseJoker(null)}>{en ? "Continue" : "Weiter"}</button></section>;
  return <section className="szc-copy"><div className="szc-copy-token"><span>◫</span><strong>{model.ownInventory.copy}</strong></div><h2>{en ? "Copy one answer?" : "Eine Antwort abschreiben?"}</h2>{!preview ? <><label>{en ? "Question" : "Frage"}<select value={categoryId} onChange={(event) => onDraftChange({ ...draft, categoryId: event.currentTarget.value as SchaetzoramaCategoryId })}>{categories.map((category) => <option key={category} value={category}>{model.categoryLabels[category]}</option>)}</select></label><label>{en ? "Player" : "Person"}<select value={targetId} onChange={(event) => onDraftChange({ ...draft, targetPlayerId: event.currentTarget.value })}>{model.copyTargets.map((player) => <option key={player.playerId} value={player.playerId}>{player.name}</option>)}</select></label><div className="szc-copy-actions"><button className="szc-button szc-button-secondary" onClick={() => model.onChooseJoker(null)}>{en ? "Keep mine" : "Eigene behalten"}</button><button className="szc-button szc-button-primary" onClick={() => model.onPreviewJoker({ kind: "copy", categoryId, targetPlayerId: target.playerId })}>{en ? "Reveal" : "Ansehen"}</button></div></> : <><div className="szc-compare"><Preview title={en ? "You" : "Du"} text={formatAnswer(model, categoryId, model.ownAnswers[categoryId])}/><Preview title={target.name} text={formatAnswer(model, categoryId, target.answers?.[categoryId])}/></div><div className="szc-copy-actions"><button className="szc-button szc-button-secondary" onClick={() => model.onChooseJoker(null)}>{en ? "Keep mine" : "Eigene behalten"}</button><button className="szc-button szc-button-submit" onClick={() => model.onChooseJoker({ kind: "copy", categoryId, targetPlayerId: target.playerId })}>{en ? "Copy" : "Abschreiben"}</button></div></>}</section>;
}

function Preview({ title, text }: { title: string; text: string }) { return <div className="szc-answer-preview"><span>{title}</span><strong>{text}</strong></div>; }
function ResultView({ model }: { model: SchaetzoramaLayoutModel }) { const en = model.language === "en"; const own = model.results.find((result) => result.playerId === model.currentPlayerId); return <section className="szc-results"><div className="szc-result-total"><span>{en ? "This round" : "Diese Runde"}</span><strong>+{own?.total ?? 0}</strong><small>{en ? "points" : "Punkte"}</small></div><div className="szc-solutions">{categories.map((category) => <div className={`szc-${category}`} key={category}><span>{glyph(category)} {model.categoryLabels[category]}</span><strong>{formatAnswer(model, category, model.solutions[category])}</strong></div>)}</div></section>; }
function Progress({ model }: { model: SchaetzoramaLayoutModel }) { return model.progress.length ? <div className="szc-progress">{model.progress.map((player) => { const done = model.stage === "joker" ? player.jokerReady : player.answered; return <i key={player.playerId} title={player.name} className={done ? "is-done" : ""} style={{ "--player": player.color } as React.CSSProperties}/>; })}</div> : null; }

function initialAnswers(model: SchaetzoramaLayoutModel): SchaetzoramaAnswerSet { if (!model.roundContent) return {}; const number = model.roundContent.questions.number as SchaetzoramaNumberQuestion; const percent = model.roundContent.questions.percent as SchaetzoramaNumberQuestion; const rank = model.roundContent.questions.rank as SchaetzoramaRankQuestion; const assign = model.roundContent.questions.assign as SchaetzoramaAssignQuestion; return { number: model.ownAnswers.number ?? { kind: "number", value: Math.round((number.min + number.max) / 2) }, percent: model.ownAnswers.percent ?? { kind: "number", value: Math.round((percent.min + percent.max) / 2) }, rank: model.ownAnswers.rank ?? { kind: "rank", order: rank.items.map((item) => item.id) }, assign: model.ownAnswers.assign ?? { kind: "assign", assignments: Object.fromEntries(assign.terms.map((term) => [term.id, "left"])) } }; }
function initialJoker(model: SchaetzoramaLayoutModel): JokerDraft { const joker = model.ownJokerPreview ?? model.ownJoker; return { categoryId: joker?.categoryId ?? "number", targetPlayerId: joker?.targetPlayerId ?? model.copyTargets[0]?.playerId ?? "" }; }
function move(order: string[], index: number, offset: number) { const target = index + offset; if (target < 0 || target >= order.length) return order; const next = [...order]; const [item] = next.splice(index, 1); next.splice(target, 0, item); return next; }
function clamp(value: number, min: number, max: number) { return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min; }
function glyph(category: SchaetzoramaCategoryId) { return category === "number" ? "#" : category === "percent" ? "%" : category === "rank" ? "↕" : "◉"; }
function stageTitle(model: SchaetzoramaLayoutModel) { const en = model.language === "en"; return model.stage === "revealed" ? (en ? "Results" : "Auflösung") : model.stage === "joker" ? (en ? "Copy round" : "Abschreiben") : (en ? "Your estimates" : "Deine Schätzungen"); }
function zoneLabel(zone: SchaetzoramaAssignmentZone, question: Pick<SchaetzoramaAssignQuestion, "leftLabel" | "rightLabel">, language: SchaetzoramaLayoutModel["language"]) { return zone === "left" ? question.leftLabel : zone === "right" ? question.rightLabel : language === "en" ? "Both" : "Beide"; }
function formatAnswer(model: SchaetzoramaLayoutModel, category: SchaetzoramaCategoryId, answer: SchaetzoramaAnswerSet[SchaetzoramaCategoryId]): string { const question = model.roundContent?.questions[category]; if (!answer || !question) return "–"; if (answer.kind === "number") return `${answer.value}${question.kind === "percent" ? "%" : question.kind === "number" && question.unitLabel ? ` ${question.unitLabel}` : ""}`; if (answer.kind === "rank" && question.kind === "rank") return answer.order.map((id) => question.items.find((item) => item.id === id)?.label ?? id).join(" › "); if (answer.kind === "assign" && question.kind === "assign") return question.terms.map((term) => `${term.label}: ${zoneLabel(answer.assignments[term.id], question, model.language)}`).join(" · "); return "–"; }
