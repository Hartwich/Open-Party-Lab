import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { DrawingGuessLayoutModel } from "./models.js";

interface DrawingGuessLayoutProps {
  model: DrawingGuessLayoutModel;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function DrawingGuessLayout({ model }: DrawingGuessLayoutProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [guess, setGuess] = useState("");
  const en = model.language === "en";

  const recentGuesses = useMemo(() => model.guessFeed.slice(-5).reverse(), [model.guessFeed]);

  useEffect(() => {
    setGuess("");
  }, [model.guessResetKey]);

  function resolveCanvasPoint(event: PointerEvent<HTMLDivElement>) {
    const element = canvasRef.current;

    if (!element) {
      return { x: 0.5, y: 0.5 };
    }

    const rect = element.getBoundingClientRect();
    const localX = (event.clientX - rect.left) / rect.width;
    const localY = (event.clientY - rect.top) / rect.height;

    return {
      x: clamp01(localX),
      y: clamp01(localY)
    };
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
        {model.isDrawer
          ? `${en ? "Your word" : "Dein Wort"}: ${model.secretWord ?? "..."}`
          : `${en ? "Word" : "Wort"}: ${model.wordMask}`}
      </div>
      {model.winnerName ? (
        <div style={{ color: "#4ade80", fontWeight: 700 }}>
          {en ? "Winner" : "Gewinner"}: {model.winnerName}
        </div>
      ) : null}

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      {model.isDrawer ? (
        <>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{en ? "Choose color" : "Farbe waehlen"}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {(model.availableColors ?? []).map((color) => {
                const selected = color === (model.currentColor ?? model.availableColors?.[0]);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => model.onSelectColor?.(color)}
                    disabled={model.disabled}
                    aria-label={`${en ? "Color" : "Farbe"} ${color}`}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      border: selected ? "3px solid #f8fafc" : "2px solid rgba(148,163,184,0.5)",
                      background: color,
                      boxShadow: selected ? "0 0 0 3px rgba(15, 23, 42, 0.8)" : "none",
                      cursor: model.disabled ? "not-allowed" : "pointer",
                      opacity: model.disabled ? 0.6 : 1
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div
            ref={canvasRef}
            style={{
              position: "relative",
              width: "100%",
              height: "clamp(320px, 62vh, 560px)",
              background: "#0f172a",
              border: "2px solid #334155",
              borderRadius: 14,
              touchAction: "none",
              overflow: "hidden"
            }}
            onPointerDown={(event) => {
              if (model.disabled) {
                return;
              }

              const point = resolveCanvasPoint(event);
              event.currentTarget.setPointerCapture(event.pointerId);
              model.onDrawStart(point.x, point.y);
            }}
            onPointerMove={(event) => {
              if (model.disabled || event.buttons === 0) {
                return;
              }

              const point = resolveCanvasPoint(event);
              model.onDrawMove(point.x, point.y);
            }}
            onPointerUp={() => {
              model.onDrawEnd();
            }}
            onPointerCancel={() => {
              model.onDrawEnd();
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
              {model.strokes.map((stroke) => {
                if (stroke.points.length === 0) {
                  return null;
                }

                if (stroke.points.length === 1) {
                  const point = stroke.points[0];
                  return (
                    <circle
                      key={stroke.id}
                      cx={point.x * 1000}
                      cy={point.y * 1000}
                      r={4}
                      fill={stroke.color}
                    />
                  );
                }

                const path = stroke.points
                  .map((point, index) => `${index === 0 ? "M" : "L"}${point.x * 1000} ${point.y * 1000}`)
                  .join(" ");

                return (
                  <path
                    key={stroke.id}
                    d={path}
                    stroke={stroke.color}
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                );
              })}
            </svg>
          </div>
          <button
            type="button"
            onClick={() => model.onClearDrawing()}
            disabled={model.disabled}
            style={{
              border: 0,
              borderRadius: 12,
              background: "#334155",
              color: "#f8fafc",
              fontSize: 16,
              fontWeight: 700,
              padding: "12px 16px"
            }}
          >
            {en ? "Clear drawing" : "Zeichnung loeschen"}
          </button>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();

            if (!guess.trim() || model.disabled) {
              return;
            }

            model.onSubmitGuess(guess.trim());
            setGuess("");
          }}
          style={{ display: "grid", gap: 10 }}
        >
          <input
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            disabled={model.disabled}
            placeholder={en ? "Your guess..." : "Dein Tipp..."}
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#f8fafc",
              fontSize: 18
            }}
          />
          <button
            type="submit"
            disabled={model.disabled || !guess.trim()}
            style={{
              border: 0,
              borderRadius: 12,
              background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
              color: "#082f49",
              fontSize: 17,
              fontWeight: 800,
              padding: "12px 16px"
            }}
          >
            {en ? "Send guess" : "Tipp senden"}
          </button>
        </form>
      )}

      <div style={{ display: "grid", gap: 6 }}>
        {recentGuesses.length === 0 ? (
          <small style={{ color: "var(--text-muted)" }}>{en ? "No guesses yet." : "Noch keine Tipps."}</small>
        ) : (
          recentGuesses.map((entry, index) => (
            <small key={`${entry.playerName}-${index}`} style={{ color: entry.correct ? "#4ade80" : "var(--text-muted)" }}>
              {entry.playerName}: {entry.guess}
            </small>
          ))
        )}
      </div>
    </div>
  );
}
