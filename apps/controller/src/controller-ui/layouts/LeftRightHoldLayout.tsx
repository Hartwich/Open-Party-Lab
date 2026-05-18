import { useEffect, useRef } from "react";
import { HoldButton } from "../common/HoldButton.js";
import { ReadyPanel } from "../common/ReadyPanel.js";
import { useHaptics } from "../../hooks/useHaptics.js";
import type { LeftRightHoldLayoutModel } from "./models.js";

interface LeftRightHoldLayoutProps {
  model: LeftRightHoldLayoutModel;
}

export function LeftRightHoldLayout({ model }: LeftRightHoldLayoutProps) {
  const haptics = useHaptics();
  const lastStatusKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastStatusKeyRef.current === model.statusKey) {
      return;
    }

    lastStatusKeyRef.current = model.statusKey;

    if (model.statusKey.includes("won")) {
      haptics.tap(120);
      return;
    }

    if (model.statusKey.includes("out")) {
      haptics.tap(70);
      return;
    }

    if (model.statusKey.includes("playing")) {
      haptics.tap(25);
    }
  }, [haptics, model.statusKey]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div
        style={{
          display: "grid",
          gap: 8,
          padding: 18,
          borderRadius: 20,
          border: "1px solid var(--panel-border)",
          background: "rgba(8, 47, 73, 0.28)"
        }}
      >
        <strong style={{ fontSize: "1.2rem", color: model.accentColor ?? "var(--accent)" }}>
          {model.statusLabel}
        </strong>
        {model.helperText ? (
          <span style={{ color: "var(--text-muted)", lineHeight: 1.45 }}>{model.helperText}</span>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        <HoldButton
          label={model.leftLabel}
          disabled={model.disabled}
          accentColor={model.accentColor}
          onHoldChange={model.onLeftChange}
        />
        <HoldButton
          label={model.rightLabel}
          disabled={model.disabled}
          accentColor={model.accentColor}
          onHoldChange={model.onRightChange}
        />
      </div>

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      {model.stats && model.stats.length > 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          {model.stats.map((stat) => (
            <div
              key={`${stat.label}-${stat.value}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 16,
                background: stat.highlighted ? "rgba(34, 211, 238, 0.14)" : "rgba(15, 23, 42, 0.45)",
                border: "1px solid var(--panel-border)"
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
