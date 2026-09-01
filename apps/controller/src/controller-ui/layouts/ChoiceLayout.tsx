import type { ChoiceLayoutModel } from "./models.js";
import { ReadyPanel } from "../common/ReadyPanel.js";

interface ChoiceLayoutProps {
  model: ChoiceLayoutModel;
}

export function ChoiceLayout({ model }: ChoiceLayoutProps) {
  const accent = model.accentColor ?? "var(--accent)";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header
        style={{
          display: "grid",
          gap: 7,
          borderLeft: `6px solid ${accent}`,
          paddingLeft: 12
        }}
      >
        <strong style={{ fontSize: "1.25rem", color: accent }}>{model.title}</strong>
        {model.subtitle ? <span style={{ color: "var(--text-muted)" }}>{model.subtitle}</span> : null}
        {model.identityLabel ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
            <span
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: accent,
                boxShadow: `0 0 0 3px color-mix(in srgb, ${accent} 24%, transparent)`
              }}
            />
            {model.identityLabel}
          </span>
        ) : null}
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
              display: "grid",
              gridTemplateColumns: choice.iconPath ? "54px minmax(0, 1fr)" : "1fr",
              alignItems: "center",
              gap: 12,
              textAlign: "left",
              border: "1px solid color-mix(in srgb, var(--muted) 36%, transparent)",
              borderRadius: "var(--radius-md)",
              background: "color-mix(in srgb, var(--surface) 68%, transparent)",
              color: "inherit",
              padding: "12px 14px",
              opacity: model.disabled || choice.disabled ? 0.55 : 1
            }}
          >
            {choice.iconPath ? (
              <img
                src={choice.iconPath}
                alt=""
                aria-hidden="true"
                style={{ width: 48, height: 48, objectFit: "contain", display: "block" }}
              />
            ) : null}
            <span style={{ minWidth: 0 }}>
              <strong style={{ display: "block", marginBottom: 4 }}>{choice.label}</strong>
              {choice.description ? (
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{choice.description}</span>
              ) : null}
            </span>
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
                background: "color-mix(in srgb, var(--surface) 52%, transparent)",
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
