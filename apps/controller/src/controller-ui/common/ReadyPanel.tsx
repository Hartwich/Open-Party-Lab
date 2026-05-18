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
        borderRadius: 18,
        border: "1px solid rgba(56, 189, 248, 0.22)",
        background: "linear-gradient(180deg, rgba(8, 47, 73, 0.42) 0%, rgba(15, 23, 42, 0.72) 100%)"
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
          borderRadius: 12,
          border: "none",
          padding: "12px 14px",
          fontWeight: 700,
          fontSize: "1rem",
          color: "var(--surface-bg)",
          background: ready.currentPlayerReady
            ? "linear-gradient(180deg, rgba(16, 185, 129, 0.96) 0%, rgba(5, 150, 105, 1) 100%)"
            : "linear-gradient(180deg, var(--accent) 0%, var(--accent-strong) 100%)",
          touchAction: "manipulation"
        }}
      >
        {ready.currentPlayerReady ? text.notReady : ready.label}
      </button>
    </section>
  );
}
