import type { ChoiceLayoutModel } from "./models.js";
import { ReadyPanel } from "../common/ReadyPanel.js";

interface ChoiceLayoutProps {
  model: ChoiceLayoutModel;
}

export function ChoiceLayout({ model }: ChoiceLayoutProps) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <strong style={{ fontSize: "1.25rem" }}>{model.title}</strong>
        {model.subtitle ? <span style={{ color: "var(--text-muted)" }}>{model.subtitle}</span> : null}
      </header>

      {model.helperText ? (
        <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.4 }}>{model.helperText}</p>
      ) : null}

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      <div style={{ display: "grid", gap: 10 }}>
        {model.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={choice.onSelect}
            disabled={model.disabled || choice.disabled}
            style={{
              textAlign: "left",
              border: "1px solid rgba(148, 163, 184, 0.36)",
              borderRadius: "var(--radius-md)",
              background: "rgba(15, 23, 42, 0.68)",
              color: "inherit",
              padding: "12px 14px",
              opacity: model.disabled || choice.disabled ? 0.55 : 1
            }}
          >
            <strong style={{ display: "block", marginBottom: 4 }}>{choice.label}</strong>
            {choice.description ? (
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{choice.description}</span>
            ) : null}
          </button>
        ))}
      </div>

      {model.stats?.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {model.stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                background: "rgba(15, 23, 42, 0.52)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px"
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {model.feed?.length ? (
        <div style={{ display: "grid", gap: 6 }}>
          <strong style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Lagebericht</strong>
          {model.feed.map((entry, index) => (
            <span key={`${entry}-${index}`} style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
              {entry}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
