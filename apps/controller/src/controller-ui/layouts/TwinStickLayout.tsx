import { useEffect, useRef, useState } from "react";
import { ActionButtonPad } from "../common/ActionButtonPad.js";
import type { TwinStickLayoutModel } from "./models.js";

interface StickVector {
  x: number;
  y: number;
}

interface StickProps {
  label: string;
  accentColor?: string;
  disabled: boolean;
  resetKey: string;
  onChange: (x: number, y: number) => void;
}

function clampUnit(x: number, y: number): StickVector {
  const magnitude = Math.hypot(x, y);

  if (magnitude <= 0.0001) {
    return { x: 0, y: 0 };
  }

  if (magnitude <= 1) {
    return { x, y };
  }

  return { x: x / magnitude, y: y / magnitude };
}

function Stick({ label, accentColor, disabled, resetKey, onChange }: StickProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    pointerRef.current = null;
    setOffset({ x: 0, y: 0 });
    onChangeRef.current(0, 0);
  }, [resetKey, disabled]);

  function update(clientX: number, clientY: number): void {
    const pad = padRef.current;

    if (!pad) {
      return;
    }

    const rect = pad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const range = Math.min(rect.width, rect.height) * 0.32;
    const raw = clampUnit((clientX - centerX) / range, (clientY - centerY) / range);
    setOffset({ x: raw.x * range, y: raw.y * range });
    onChangeRef.current(raw.x, raw.y);
  }

  function reset(): void {
    pointerRef.current = null;
    setOffset({ x: 0, y: 0 });
    onChangeRef.current(0, 0);
  }

  return (
    <div
      ref={padRef}
      onPointerDown={(event) => {
        if (disabled) {
          return;
        }

        pointerRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (disabled || pointerRef.current !== event.pointerId) {
          return;
        }

        event.preventDefault();
        update(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        if (pointerRef.current === event.pointerId) {
          reset();
        }
      }}
      onPointerCancel={reset}
      onLostPointerCapture={reset}
      style={{
        position: "relative",
        width: "min(42vw, 240px)",
        aspectRatio: "1 / 1",
        borderRadius: "999px",
        border: `1px solid ${accentColor ?? "var(--panel-border)"}`,
        background: "radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.2) 0%, rgba(2, 6, 23, 0.95) 78%)",
        touchAction: "none"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "37%",
          borderRadius: "999px",
          border: "1px solid rgba(148,163,184,0.2)"
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "28%",
          aspectRatio: "1 / 1",
          borderRadius: "999px",
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
          background: `linear-gradient(180deg, ${accentColor ?? "#22d3ee"}, #0ea5e9)`,
          display: "grid",
          placeItems: "center",
          color: "#e2e8f0",
          fontWeight: 700,
          fontSize: "0.72rem"
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function TwinStickLayout({ model }: { model: TwinStickLayoutModel }) {
  const hasInteractButton = Boolean(model.interactButton);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <strong style={{ fontSize: "1.25rem", color: model.accentColor ?? "var(--accent)" }}>{model.title}</strong>
        {model.subtitle ? <span style={{ color: "var(--text-muted)" }}>{model.subtitle}</span> : null}
        {model.helperText ? <span style={{ color: "var(--text-muted)" }}>{model.helperText}</span> : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: hasInteractButton ? "auto auto auto" : "auto auto",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14
        }}
      >
        <Stick
          label={model.leftStickLabel ?? "MOVE"}
          accentColor={model.accentColor}
          disabled={model.disabled}
          resetKey={model.resetKey}
          onChange={model.onMoveChange}
        />

        {model.interactButton ? (
          <ActionButtonPad
            buttons={[model.interactButton]}
            disabled={model.disabled}
            columns={1}
            buttonSize="min(24vw, 120px)"
            justify="center"
          />
        ) : null}

        <Stick
          label={model.rightStickLabel ?? "AIM"}
          accentColor="#f97316"
          disabled={model.disabled}
          resetKey={model.resetKey}
          onChange={model.onAimChange}
        />
      </div>

      {model.stats?.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {model.stats.map((entry) => (
            <div
              key={`${entry.label}:${entry.value}`}
              style={{ padding: 10, border: "1px solid var(--panel-border)", borderRadius: 10 }}
            >
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{entry.label}</div>
              <strong>{entry.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
