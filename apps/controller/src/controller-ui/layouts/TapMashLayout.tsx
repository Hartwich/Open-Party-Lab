import { BigButton } from "../common/BigButton.js";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { TapMashLayoutModel } from "./models.js";

interface TapMashLayoutProps {
  model: TapMashLayoutModel;
}

export function TapMashLayout({ model }: TapMashLayoutProps) {
  const progressPercent = model.progress.max > 0
    ? Math.min(100, Math.round((model.progress.current / model.progress.max) * 100))
    : 0;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <strong style={{ fontSize: "1.3rem" }}>{model.title}</strong>
        {model.subtitle ? <span style={{ color: "var(--text-muted)" }}>{model.subtitle}</span> : null}
      </header>

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      <div
        style={{
          borderRadius: "999px",
          overflow: "hidden",
          background: "rgba(15, 23, 42, 0.56)",
          height: 18
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            background: "linear-gradient(90deg, #22d3ee 0%, #10b981 100%)"
          }}
        />
      </div>

      <BigButton
        disabled={model.disabled}
        onClick={model.onPress}
        style={{ opacity: model.disabled ? 0.55 : 1 }}
      >
        {model.buttonLabel}
      </BigButton>

      {model.helperText ? (
        <p style={{ margin: 0, color: "var(--text-muted)", textAlign: "center" }}>{model.helperText}</p>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
        {model.rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              background: row.highlighted ? "rgba(34, 211, 238, 0.16)" : "rgba(15, 23, 42, 0.52)"
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
