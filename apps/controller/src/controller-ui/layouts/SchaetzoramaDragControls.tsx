import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { SchaetzoramaAssignQuestion, SchaetzoramaAssignmentZone, SchaetzoramaRankQuestion } from "@open-party-lab/protocol";

interface Drag { pointerId: number; origin: number; index: number; target: number; offset: number; centers: number[]; distance: number }

export function RankingControl({ question, order, en, disabled, onChange }: {
  question: Omit<SchaetzoramaRankQuestion, "answerOrder">;
  order: string[]; en: boolean; disabled: boolean; onChange: (order: string[]) => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  const gesture = useRef<Drag | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const reorder = (from: number, to: number) => {
    if (disabled || from === to || to < 0 || to >= order.length) return;
    const next = [...order];
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id);
    onChange(next);
    const label = question.items.find((item) => item.id === id)?.label ?? id;
    setAnnouncement(`${label}: ${en ? "position" : "Platz"} ${to + 1}`);
  };
  const begin = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    if (disabled || !event.isPrimary || event.button !== 0 || !list.current) return;
    const rects = Array.from(list.current.children, (row) => row.getBoundingClientRect());
    const next: Drag = { pointerId: event.pointerId, origin: event.clientY, index, target: index, offset: 0,
      centers: rects.map((rect) => rect.top + rect.height / 2), distance: rects[index].height + 8 };
    list.current.setPointerCapture(event.pointerId);
    gesture.current = next;
    setDrag(next);
  };
  const update = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const offset = Math.max(current.centers[0] - current.centers[current.index], Math.min(current.centers.at(-1)! - current.centers[current.index], event.clientY - current.origin));
    const center = current.centers[current.index] + offset;
    const target = current.centers.reduce((best, value, index) => Math.abs(value - center) < Math.abs(current.centers[best] - center) ? index : best, 0);
    gesture.current = { ...current, offset, target };
    setDrag(gesture.current);
  };
  const end = (event: PointerEvent<HTMLDivElement>, commit: boolean) => {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointerId) return;
    gesture.current = null;
    setDrag(null);
    if (commit) reorder(current.index, current.target);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div className="szc-rank-control">
    <p className="szc-direction">{question.directionLabel}</p>
    <div ref={list} className="szc-rank-list" onPointerMove={update} onPointerUp={(event) => end(event, true)} onPointerCancel={(event) => end(event, false)} onLostPointerCapture={(event) => end(event, false)}>
      {order.map((id, index) => {
        const item = question.items.find((entry) => entry.id === id)!;
        let offset = 0;
        if (drag) {
          if (index === drag.index) offset = drag.offset;
          else if (index > drag.index && index <= drag.target) offset = -drag.distance;
          else if (index < drag.index && index >= drag.target) offset = drag.distance;
        }
        return <div key={id} data-rank-id={id} className={`szc-rank-row${drag?.index === index ? " is-dragging" : ""}`} style={{ transform: `translateY(${offset}px)` }}>
          <b>{drag?.index === index ? drag.target + 1 : index + 1}</b>
          <button type="button" className="szc-rank-grip" disabled={disabled} onPointerDown={(event) => begin(event, index)}
            aria-label={`${item.label}: ${en ? "reorder" : "Reihenfolge ändern"}`} title={en ? "Drag to reorder" : "Zum Sortieren ziehen"}
            onKeyDown={(event) => { if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); reorder(index, index + (event.key === "ArrowUp" ? -1 : 1)); } }}>
            <span>{item.label}</span><span aria-hidden="true" className="szc-grip-mark">⠿</span>
          </button>
          <div className="szc-rank-arrows"><button type="button" disabled={disabled || index === 0} aria-label={`${item.label}: ${en ? "move up" : "nach oben"}`} onClick={() => reorder(index, index - 1)}>↑</button><button type="button" disabled={disabled || index === order.length - 1} aria-label={`${item.label}: ${en ? "move down" : "nach unten"}`} onClick={() => reorder(index, index + 1)}>↓</button></div>
        </div>;
      })}
    </div>
    <span className="szc-sr-only" role="status">{announcement}</span>
  </div>;
}

const zones: SchaetzoramaAssignmentZone[] = ["left", "both", "right"];

export function AssignmentControl({ question, assignments, en, disabled, onChange }: {
  question: Omit<SchaetzoramaAssignQuestion, "answers">;
  assignments: Record<string, SchaetzoramaAssignmentZone>; en: boolean; disabled: boolean;
  onChange: (assignments: Record<string, SchaetzoramaAssignmentZone>) => void;
}) {
  const labels = [question.leftLabel, en ? "Both" : "Beide", question.rightLabel];
  return <div className="szc-assign-control">
    <div className="szc-zone-headings">{labels.map((label, index) => <div key={index}><span aria-hidden="true">{["←", "∩", "→"][index]}</span><strong>{label}</strong></div>)}</div>
    {question.terms.map((term) => <AssignmentRail key={term.id} id={term.id} label={term.label} labels={labels} zone={assignments[term.id] ?? "both"} disabled={disabled}
      onChange={(zone) => onChange({ ...assignments, [term.id]: zone })} />)}
  </div>;
}

function AssignmentRail({ id, label, labels, zone, disabled, onChange }: {
  id: string; label: string; labels: string[]; zone: SchaetzoramaAssignmentZone; disabled: boolean;
  onChange: (zone: SchaetzoramaAssignmentZone) => void;
}) {
  const gesture = useRef<{ pointerId: number; x: number; start: number; width: number; value: number } | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const index = zones.indexOf(zone);
  const finish = (event: PointerEvent<HTMLButtonElement>, commit: boolean) => {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointerId) return;
    gesture.current = null;
    setPosition(null);
    if (commit && !disabled) onChange(zones[Math.round(current.value)]);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div className="szc-assign-rail" data-term-id={id} data-zone={zone}>
    <div className="szc-zone-targets">{zones.map((target, targetIndex) => <button key={target} type="button" disabled={disabled} aria-label={`${label}: ${labels[targetIndex]}`} aria-pressed={zone === target} onClick={() => onChange(target)}><span aria-hidden="true">{["←", "∩", "→"][targetIndex]}</span></button>)}</div>
    <button type="button" className={`szc-assign-tile${position !== null ? " is-dragging" : ""}`} disabled={disabled}
      style={{ "--position": position ?? index } as CSSProperties} role="slider" aria-label={label} aria-valuemin={0} aria-valuemax={2} aria-valuenow={Math.round(position ?? index)} aria-valuetext={labels[Math.round(position ?? index)]}
      onPointerDown={(event) => {
        if (disabled || !event.isPrimary || event.button !== 0) return;
        const width = event.currentTarget.parentElement!.getBoundingClientRect().width / 3;
        gesture.current = { pointerId: event.pointerId, x: event.clientX, start: index, width, value: index };
        event.currentTarget.setPointerCapture(event.pointerId);
        setPosition(index);
      }}
      onPointerMove={(event) => {
        const current = gesture.current;
        if (!current || event.pointerId !== current.pointerId) return;
        current.value = Math.max(0, Math.min(2, current.start + (event.clientX - current.x) / current.width));
        setPosition(current.value);
      }}
      onPointerUp={(event) => finish(event, true)} onPointerCancel={(event) => finish(event, false)} onLostPointerCapture={(event) => finish(event, false)}
      onKeyDown={(event) => {
        const target = event.key === "ArrowLeft" ? Math.max(0, index - 1) : event.key === "ArrowRight" ? Math.min(2, index + 1) : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
        if (target !== null) { event.preventDefault(); onChange(zones[target]); }
      }}><strong>{label}</strong><span aria-hidden="true">↔</span></button>
  </div>;
}
