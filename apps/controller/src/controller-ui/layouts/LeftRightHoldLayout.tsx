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
    <div style={{
      display: "grid",
      gap: 14,
      minHeight: model.ready ? undefined : "clamp(265px, 68svh, 560px)",
      gridTemplateRows: model.ready ? undefined : "minmax(76px, 1fr) auto",
      padding: "clamp(12px, 3vw, 22px)",
      borderRadius: 16,
      border: "1px solid #30334c",
      background: "linear-gradient(128deg, #20162d, #0f172a 72%)",
      color: "#f3f6ff"
    }}>
      <div
        role="status"
        style={{
          display: "grid",
          alignContent: "center",
          gap: 4,
          minHeight: 58,
          padding: "4px 2px"
        }}
      >
        <strong style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 9 }}>
          <span aria-hidden style={{
            width: 9, height: 9, borderRadius: 2, background: model.accentColor ?? "#72d9fc",
            boxShadow: `0 0 8px ${model.accentColor ?? "#72d9fc"}`
          }} />
          {model.statusLabel}
        </strong>
        {model.helperText ? (
          <span style={{ color: "#afbbd5", fontSize: "0.9rem" }}>{model.helperText}</span>
        ) : null}
      </div>

      {!model.ready ? <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <HoldButton
          direction="left"
          label={model.leftLabel}
          disabled={model.disabled}
          accentColor={model.accentColor}
          onHoldChange={model.onLeftChange}
        />
        <HoldButton
          direction="right"
          label={model.rightLabel}
          disabled={model.disabled}
          accentColor={model.accentColor}
          onHoldChange={model.onRightChange}
        />
      </div> : null}

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      {model.stats && model.stats.length > 0 ? (
        <div style={{ display: "grid", gap: 8 }}>
          {model.stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "8px 2px 1px",
                borderTop: "1px solid #30334c",
                fontSize: "0.85rem"
              }}
            >
              <span style={{ color: "#afbbd5" }}>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
