import { BigButton } from "../common/BigButton.js";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { SingleButtonLayoutModel } from "./models.js";

interface SingleButtonLayoutProps {
  model: SingleButtonLayoutModel;
}

export function SingleButtonLayout({ model }: SingleButtonLayoutProps) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <strong style={{ fontSize: "1.3rem" }}>{model.title}</strong>
        {model.subtitle ? <span style={{ color: "var(--text-muted)" }}>{model.subtitle}</span> : null}
      </header>

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

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

      {model.stats?.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {model.stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: "rgba(15, 23, 42, 0.52)"
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
