import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ReadyPanel } from "../common/ReadyPanel.js";
import { contrastInk } from "../common/contrastInk.js";
import type { DrawingGuessLayoutModel } from "./models.js";

interface DrawingGuessLayoutProps {
  model: DrawingGuessLayoutModel;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function DrawingGuessLayout({ model }: DrawingGuessLayoutProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const lastAspectSent = useRef<number | null>(null);
  const setCanvasAspectRef = useRef(model.onSetCanvasAspect);
  setCanvasAspectRef.current = model.onSetCanvasAspect;
  const [guess, setGuess] = useState("");
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth > window.innerHeight : false
  );
  const en = model.language === "en";
  const recentGuesses = useMemo(() => model.guessFeed.slice(-4).reverse(), [model.guessFeed]);

  useEffect(() => {
    setGuess("");
  }, [model.guessResetKey]);

  useEffect(() => {
    const updateOrientation = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener("resize", updateOrientation);
    return () => window.removeEventListener("resize", updateOrientation);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !model.isDrawer || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry?.contentRect ?? {};
      if (!width || !height) return;
      const aspectRatio = width / height;
      if (lastAspectSent.current !== null && Math.abs(lastAspectSent.current - aspectRatio) < 0.025) return;
      lastAspectSent.current = aspectRatio;
      setCanvasAspectRef.current(aspectRatio);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [model.isDrawer]);

  function resolveCanvasPoint(event: PointerEvent<HTMLDivElement>) {
    const element = canvasRef.current;
    if (!element) return { x: 0.5, y: 0.5 };
    const rect = element.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height)
    };
  }

  const word = model.isDrawer
    ? `${en ? "Your word" : "Dein Wort"}: ${model.secretWord ?? "…"}`
    : `${en ? "Word" : "Wort"}: ${model.wordMask}`;

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
      onClick={model.onClearDrawing}
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
        if (model.disabled) return;
        const point = resolveCanvasPoint(event);
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Drawing still works on browsers where touch pointer capture is unavailable.
        }
        model.onDrawStart(point.x, point.y);
      }}
      onPointerMove={(event) => {
        if (model.disabled || event.buttons === 0) return;
        const point = resolveCanvasPoint(event);
        model.onDrawMove(point.x, point.y);
      }}
      onPointerUp={model.onDrawEnd}
      onPointerCancel={model.onDrawEnd}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 1000 ${1000 / Math.max(0.4, Math.min(2.5, model.canvasAspectRatio))}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {model.strokes.map((stroke) => {
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
              {clearButton}
              {guesses}
            </aside>
          </>
        ) : (
          <>
            {portraitToolbar}
            {canvas}
            {clearButton}
            {guesses}
          </>
        )
      ) : (
        <div style={{ gridColumn: "1 / -1", display: "flex", minHeight: 0, flexDirection: "column", justifyContent: "center", gap: 12, overflow: "hidden" }}>
          {model.winnerName ? <div style={{ color: "var(--sage)", fontWeight: 700, lineHeight: 1.1 }}>{en ? "Winner" : "Gewinner"}: {model.winnerName}</div> : null}
          {model.ready ? <ReadyPanel ready={model.ready} /> : null}
          <div style={wordStyle}>{word}</div>
          {guessForm}
          {guesses}
        </div>
      )}
    </div>
  );
}
