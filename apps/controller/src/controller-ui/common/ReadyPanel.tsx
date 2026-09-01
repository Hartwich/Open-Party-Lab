import type { ReadyLayoutModel } from "../layouts/models.js";
import { getControllerText } from "../../i18n/controllerText.js";

interface ReadyPanelProps {
  ready: ReadyLayoutModel;
}

export function ReadyPanel({ ready }: ReadyPanelProps) {
  const text = getControllerText(ready.language);

  return (
    <section
      style={{
        display: "grid",
        gap: 12,
        padding: 16,
        borderRadius: 8,
        border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
        background: "linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 42%, transparent) 0%, color-mix(in srgb, var(--surface) 72%, transparent) 100%)"
      }}
    >
      <strong style={{ fontSize: "1rem" }}>
        {ready.currentPlayerReady ? text.readyForNextRound : text.readyForNextRoundQuestion}
      </strong>
      <span style={{ color: "var(--text-muted)", lineHeight: 1.45 }}>
        {ready.description ?? text.waitForPlayers(ready.readyCount, ready.playerCount)}
      </span>
      <button
        type="button"
        onClick={ready.onToggleReady}
        style={{
          width: "100%",
          minHeight: 54,
          borderRadius: 7,
          border: "none",
          padding: "12px 14px",
          fontWeight: 700,
          fontSize: "1rem",
          color: "var(--on-accent)",
          background: ready.currentPlayerReady
            ? "linear-gradient(180deg, color-mix(in srgb, var(--sage) 96%, transparent) 0%, var(--sage-strong) 100%)"
            : "linear-gradient(180deg, var(--accent) 0%, var(--accent-strong) 100%)",
          touchAction: "manipulation"
        }}
      >
        {ready.currentPlayerReady ? text.notReady : ready.label}
      </button>
    </section>
  );
}
