import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ReadyPanel } from "../common/ReadyPanel.js";
import { contrastInk } from "../common/contrastInk.js";
import type { DrawingGuessLayoutModel } from "./models.js";

interface DrawingGuessLayoutProps {
  model: DrawingGuessLayoutModel;
}

interface LocalStroke {
  points: Array<{ x: number; y: number }>;
  path: SVGPathElement;
  ended: boolean;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function TurnTimer({ deadline, getServerTime = Date.now }: { deadline: number; getServerTime?: () => number }) {
  const [now, setNow] = useState(getServerTime);
  useEffect(() => { const timer = window.setInterval(() => setNow(getServerTime()), 250); return () => window.clearInterval(timer); }, [getServerTime]);
  return <strong role="timer" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.max(0, Math.ceil((deadline - now) / 1000))} s</strong>;
}

export function DrawingGuessLayout({ model }: DrawingGuessLayoutProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<SVGGElement | null>(null);
  const pendingStrokes = useRef(new Map<string, LocalStroke>());
  const hiddenStrokeIds = useRef(new Set<string>());
  const hiddenClientIds = useRef(new Set<string>());
  const activePointer = useRef<{ pointerId: number; strokeId: string; rect: DOMRect } | null>(null);
  const endDrawingRef = useRef(model.onDrawEnd);
  endDrawingRef.current = model.onDrawEnd;
  const [, refreshClearedDrawing] = useState(0);
  const setCanvasAspectRef = useRef(model.onSetCanvasAspect);
  setCanvasAspectRef.current = model.onSetCanvasAspect;
  const [guess, setGuess] = useState("");
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth > window.innerHeight : false
  );
  const en = model.language === "en";
  const recentGuesses = useMemo(() => model.guessFeed.slice(-4).reverse(), [model.guessFeed]);
  const boardHeight = 1000 / Math.max(0.4, Math.min(2.5, model.canvasAspectRatio));

  // React owns the authoritative SVG; this separate layer paints pointer input
  // immediately, without a network round trip or a React render for each point.
  useLayoutEffect(() => {
    if (activePointer.current) endDrawingRef.current();
    activePointer.current = null;
    pendingStrokes.current.clear();
    hiddenStrokeIds.current.clear();
    hiddenClientIds.current.clear();
    previewRef.current?.replaceChildren();
  }, [model.guessResetKey, model.disabled, model.isDrawer, isLandscape]);

  useLayoutEffect(() => {
    const confirmedByClientId = new Map(model.strokes.map((stroke) => [stroke.clientStrokeId, stroke]));
    for (const [id, local] of pendingStrokes.current) {
      const confirmed = confirmedByClientId.get(id);
      if (local.ended && confirmed && confirmed.points.length >= local.points.length
        && local.points.every((point, index) => confirmed.points[index].x === point.x && confirmed.points[index].y === point.y)) {
        local.path.remove();
        pendingStrokes.current.delete(id);
      }
    }
  }, [model.strokes]);

  useLayoutEffect(() => {
    for (const local of pendingStrokes.current.values()) {
      local.path.setAttribute("d", local.points.map((point, index) =>
        `${index === 0 ? "M" : "L"}${point.x * 1000} ${point.y * boardHeight}`
      ).join(" ") + (local.points.length === 1 ? " l0 0" : ""));
    }
  }, [boardHeight]);

  useEffect(() => {
    const endStroke = () => {
      const active = activePointer.current;
      if (!active) return;
      const local = pendingStrokes.current.get(active.strokeId);
      if (local) local.ended = true;
      activePointer.current = null;
      endDrawingRef.current();
    };
    window.addEventListener("blur", endStroke);
    return () => {
      window.removeEventListener("blur", endStroke);
      endStroke();
    };
  }, []);

  useEffect(() => {
    setGuess("");
  }, [model.guessResetKey]);

  useEffect(() => {
    const updateOrientation = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener("resize", updateOrientation);
    return () => window.removeEventListener("resize", updateOrientation);
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !model.isDrawer || model.disabled) return undefined;

    // Intro measurements are rejected by the server. Measure again when drawing
    // becomes enabled, each round, and when orientation replaces the canvas node.
    let lastAspectSent: number | null = null;
    const reportAspect = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const aspectRatio = Math.max(0.4, Math.min(2.5, width / height));
      if (lastAspectSent !== null && Math.abs(lastAspectSent - aspectRatio) < 0.025) return;
      lastAspectSent = aspectRatio;
      setCanvasAspectRef.current(aspectRatio);
    };
    reportAspect();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(reportAspect);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [model.isDrawer, model.disabled, model.guessResetKey, isLandscape]);

  function resolveCanvasPoint(event: PointerEvent<HTMLDivElement>) {
    const element = canvasRef.current;
    if (!element) return { x: 0.5, y: 0.5 };
    const rect = activePointer.current?.rect ?? element.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height)
    };
  }

  function appendPoint(event: PointerEvent<HTMLDivElement>) {
    const active = activePointer.current;
    if (!active || active.pointerId !== event.pointerId || model.disabled) return;
    const point = resolveCanvasPoint(event);
    const local = pendingStrokes.current.get(active.strokeId);
    if (!local) return;
    const last = local.points[local.points.length - 1];
    if (last.x === point.x && last.y === point.y) return;
    local.points.push(point);
    local.path.setAttribute("d", `${local.path.getAttribute("d")} L${point.x * 1000} ${point.y * boardHeight}`);
    model.onDrawMove(point.x, point.y);
  }

  function finishStroke(event: PointerEvent<HTMLDivElement>, includeLastPoint = false) {
    const active = activePointer.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (includeLastPoint) appendPoint(event);
    const local = pendingStrokes.current.get(active.strokeId);
    if (local) local.ended = true;
    activePointer.current = null;
    model.onDrawEnd();
  }

  function clearDrawing() {
    if (model.disabled) return;
    if (activePointer.current) model.onDrawEnd();
    activePointer.current = null;
    for (const stroke of model.strokes) hiddenStrokeIds.current.add(stroke.id);
    for (const id of pendingStrokes.current.keys()) hiddenClientIds.current.add(id);
    pendingStrokes.current.clear();
    previewRef.current?.replaceChildren();
    refreshClearedDrawing((version) => version + 1);
    model.onClearDrawing();
  }

  const word = model.isDrawer
    ? `${en ? "Your word" : "Dein Wort"}: ${model.secretWord ?? "…"}`
    : `${en ? "Word" : "Wort"}: ${model.wordMask}`;

  const turnControls = model.turnActions ? <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
    {model.turnDeadline ? <TurnTimer deadline={model.turnDeadline} getServerTime={model.getServerTime} /> : null}
    {model.turnStatus ? <span style={{ fontSize: 13, flex: "1 1 auto" }}>{model.turnStatus}</span> : null}
    {model.turnActions.map((action) => <button key={action.id} type="button" disabled={model.disabled || action.disabled}
      onClick={action.onPress} style={{ padding: "10px 14px", minHeight: 44, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-muted)", color: "var(--ink)" }}>{action.label}</button>)}
  </div> : null;

  const wordStyle = {
    color: "var(--ink)",
    fontSize: isLandscape ? 17 : 18,
    fontWeight: 700,
    lineHeight: 1.2,
    minWidth: 0,
    overflowWrap: "anywhere" as const
  };

  const palette = (
    <div
      aria-label={en ? "Drawing colors" : "Zeichenfarben"}
      style={{ display: "flex", flexWrap: "wrap", alignContent: "center", gap: isLandscape ? 7 : 6 }}
    >
      {(model.availableColors ?? []).map((color) => {
        const selected = color === (model.currentColor ?? model.availableColors?.[0]);
        return (
          <button
            key={color}
            type="button"
            onClick={() => model.onSelectColor?.(color)}
            disabled={model.disabled}
            aria-label={`${en ? "Color" : "Farbe"} ${color}`}
            aria-pressed={selected}
            style={{
              width: isLandscape ? 34 : 28,
              height: isLandscape ? 34 : 28,
              flex: "0 0 auto",
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              border: selected ? "3px solid var(--ink)" : "2px solid color-mix(in srgb, var(--muted) 50%, transparent)",
              background: color,
              boxShadow: selected ? "0 0 0 2px color-mix(in srgb, var(--surface) 80%, transparent)" : "none",
              cursor: model.disabled ? "not-allowed" : "pointer",
              opacity: model.disabled ? 0.6 : 1,
              padding: 0
            }}
          >
            {selected ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={contrastInk(color)} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5 10 17.5 19 7" />
              </svg>
            ) : null}
          </button>
        );
      })}
    </div>
  );

  const clearButton = (
    <button
      type="button"
      onClick={clearDrawing}
      disabled={model.disabled}
      style={{
        width: "100%",
        minHeight: isLandscape ? 42 : 44,
        border: 0,
        borderRadius: 12,
        background: "var(--line-strong)",
        color: "var(--ink)",
        fontSize: isLandscape ? 15 : 16,
        fontWeight: 700,
        padding: "8px 12px"
      }}
    >
      {en ? "Clear drawing" : "Zeichnung loeschen"}
    </button>
  );

  const canvas = model.isDrawer ? (
    <div
      ref={canvasRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        background: "var(--surface-raised)",
        boxShadow: "inset 0 0 0 2px var(--line-strong)",
        touchAction: "none",
        overflow: "hidden"
      }}
      onPointerDown={(event) => {
        if (model.disabled || activePointer.current || (event.pointerType === "mouse" && event.button !== 0)) return;
        const point = resolveCanvasPoint(event);
        const strokeId = globalThis.crypto?.randomUUID?.()
          ?? `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M${point.x * 1000} ${point.y * boardHeight} l0 0`);
        path.setAttribute("stroke", model.currentColor ?? model.availableColors?.[0] ?? "#101418");
        path.setAttribute("stroke-width", "8");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("fill", "none");
        previewRef.current?.appendChild(path);
        pendingStrokes.current.set(strokeId, { points: [point], path, ended: false });
        activePointer.current = { pointerId: event.pointerId, strokeId, rect: event.currentTarget.getBoundingClientRect() };
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Drawing still works on browsers where touch pointer capture is unavailable.
        }
        model.onDrawStart(point.x, point.y, strokeId);
      }}
      onPointerMove={appendPoint}
      onPointerUp={(event) => finishStroke(event, true)}
      onPointerCancel={(event) => finishStroke(event)}
      onLostPointerCapture={(event) => finishStroke(event)}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 1000 ${1000 / Math.max(0.4, Math.min(2.5, model.canvasAspectRatio))}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {model.strokes.map((stroke) => {
          if (hiddenStrokeIds.current.has(stroke.id) || (stroke.clientStrokeId && hiddenClientIds.current.has(stroke.clientStrokeId))) return null;
          if (stroke.points.length === 0) return null;
          const boardHeight = 1000 / Math.max(0.4, Math.min(2.5, model.canvasAspectRatio));
          if (stroke.points.length === 1) {
            const point = stroke.points[0];
            return <circle key={stroke.id} cx={point.x * 1000} cy={point.y * boardHeight} r={4} fill={stroke.color} />;
          }
          const path = stroke.points
            .map((point, index) => `${index === 0 ? "M" : "L"}${point.x * 1000} ${point.y * boardHeight}`)
            .join(" ");
          return <path key={stroke.id} d={path} stroke={stroke.color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
        })}
        <g ref={previewRef} />
      </svg>
    </div>
  ) : null;

  const guesses = recentGuesses.length > 0 ? (
    <div style={{ display: "grid", alignContent: "start", gap: 4, maxHeight: isLandscape ? 72 : 64, overflow: "hidden", color: "var(--text-muted)", fontSize: 12 }}>
      {recentGuesses.map((entry, index) => (
        <small key={`${entry.playerName}-${index}`} style={{ color: entry.correct ? "var(--sage)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.playerName}: {entry.guess}
        </small>
      ))}
    </div>
  ) : null;

  const guessForm = (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!guess.trim() || model.disabled) return;
        model.onSubmitGuess(guess.trim());
        setGuess("");
      }}
      style={{ display: "grid", gap: 8 }}
    >
      <input
        value={guess}
        onChange={(event) => setGuess(event.target.value)}
        disabled={model.disabled}
        placeholder={en ? "Your guess..." : "Dein Tipp..."}
        style={{ minWidth: 0, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--ink)", fontSize: 18 }}
      />
      <button
        type="submit"
        disabled={model.disabled || !guess.trim()}
        style={{ minHeight: 44, border: 0, borderRadius: 12, background: "var(--accent)", color: "var(--on-accent)", fontSize: 16, fontWeight: 800, padding: "10px 14px" }}
      >
        {en ? "Send guess" : "Tipp senden"}
      </button>
    </form>
  );

  const portraitToolbar = (
    <div style={{ display: "grid", gap: 5, minHeight: 0, alignContent: "start", overflow: "hidden" }}>
      {model.winnerName ? <div style={{ color: "var(--sage)", fontWeight: 700, lineHeight: 1.1 }}>{en ? "Winner" : "Gewinner"}: {model.winnerName}</div> : null}
      {model.ready ? <ReadyPanel ready={model.ready} /> : null}
      <div style={wordStyle}>{word}</div>
      {palette}
    </div>
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: model.isDrawer && isLandscape ? "minmax(0, 1fr) minmax(172px, 0.42fr)" : "minmax(0, 1fr)",
        gridTemplateRows: model.isDrawer && isLandscape
          ? "minmax(0, 1fr)"
          : model.isDrawer
            ? recentGuesses.length > 0 ? "auto minmax(0, 1fr) auto auto" : "auto minmax(0, 1fr) auto"
            : "minmax(0, 1fr)",
        gap: isLandscape ? 10 : 7,
        width: "100%",
        height: "calc(100dvh - max(10px, env(safe-area-inset-top)) - max(10px, env(safe-area-inset-bottom)))",
        maxHeight: "calc(100dvh - max(10px, env(safe-area-inset-top)) - max(10px, env(safe-area-inset-bottom)))",
        minHeight: 0,
        overflow: "hidden"
      }}
    >
      {model.isDrawer ? (
        isLandscape ? (
          <>
            {canvas}
            <aside style={{ display: "flex", minWidth: 0, minHeight: 0, flexDirection: "column", justifyContent: "space-between", gap: 10, overflow: "hidden" }}>
              {model.winnerName ? <div style={{ color: "var(--sage)", fontWeight: 700, lineHeight: 1.1 }}>{en ? "Winner" : "Gewinner"}: {model.winnerName}</div> : null}
              {model.ready ? <ReadyPanel ready={model.ready} /> : null}
              <div style={wordStyle}>{word}</div>
              {palette}
              <div style={{ display: "grid", gap: 5 }}>{clearButton}{turnControls}</div>
              {guesses}
            </aside>
          </>
        ) : (
          <>
            {portraitToolbar}
            {canvas}
            <div style={{ display: "grid", gap: 5 }}>{clearButton}{turnControls}</div>
            {guesses}
          </>
        )
      ) : (
        <div style={{ gridColumn: "1 / -1", display: "flex", minHeight: 0, flexDirection: "column", justifyContent: "flex-start", paddingTop: isLandscape ? "8dvh" : "18dvh", gap: 12, overflow: "hidden" }}>
          {model.winnerName ? <div style={{ color: "var(--sage)", fontWeight: 700, lineHeight: 1.1 }}>{en ? "Winner" : "Gewinner"}: {model.winnerName}</div> : null}
          {model.ready ? <ReadyPanel ready={model.ready} /> : null}
          <div style={wordStyle}>{word}</div>
          {model.turnActions ? turnControls : guessForm}
          {guesses}
        </div>
      )}
    </div>
  );
}
