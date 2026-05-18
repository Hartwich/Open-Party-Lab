import { useEffect, useRef, useState } from "react";
import { ActionButtonPad } from "../common/ActionButtonPad.js";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { VirtualJoystickLayoutModel } from "./models.js";

interface VirtualJoystickLayoutProps {
  model: VirtualJoystickLayoutModel;
}

interface Vector2 {
  moveX: number;
  moveY: number;
}

const DEADZONE = 0.12;

function clampMagnitude(x: number, y: number): Vector2 {
  const magnitude = Math.hypot(x, y);

  if (magnitude <= 0.0001) {
    return { moveX: 0, moveY: 0 };
  }

  if (magnitude <= 1) {
    return { moveX: x, moveY: y };
  }

  return {
    moveX: x / magnitude,
    moveY: y / magnitude
  };
}

function applyResponseMapping(x: number, y: number): Vector2 {
  const clamped = clampMagnitude(x, y);
  const magnitude = Math.hypot(clamped.moveX, clamped.moveY);

  if (magnitude <= DEADZONE) {
    return { moveX: 0, moveY: 0 };
  }

  const normalizedX = clamped.moveX / magnitude;
  const normalizedY = clamped.moveY / magnitude;
  const scaledMagnitude = (magnitude - DEADZONE) / (1 - DEADZONE);
  const shapedMagnitude = scaledMagnitude;

  return {
    moveX: normalizedX * shapedMagnitude,
    moveY: normalizedY * shapedMagnitude
  };
}

function hasMeaningfulVectorChange(previous: Vector2, next: Vector2): boolean {
  return (
    Math.abs(previous.moveX - next.moveX) > 0.015 ||
    Math.abs(previous.moveY - next.moveY) > 0.015
  );
}

export function VirtualJoystickLayout({ model }: VirtualJoystickLayoutProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastVectorRef = useRef<Vector2>({ moveX: 0, moveY: 0 });
  const onMoveChangeRef = useRef(model.onMoveChange);
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0, active: false });
  const actionButtons = model.actionButtons ?? [];
  const buttonColumns =
    model.actionButtonColumns ??
    (actionButtons.length >= 4 ? 2 : 1);
  const hasActionButtons = actionButtons.length > 0;
  const controlSize = hasActionButtons ? "min(42vw, 220px)" : "min(78vw, 320px)";
  const buttonSize =
    actionButtons.length >= 4
      ? "min(19vw, 96px)"
      : "min(34vw, 180px)";

  useEffect(() => {
    onMoveChangeRef.current = model.onMoveChange;
  }, [model.onMoveChange]);

  useEffect(() => {
    activePointerIdRef.current = null;
    setThumbOffset({ x: 0, y: 0, active: false });

    if (lastVectorRef.current.moveX !== 0 || lastVectorRef.current.moveY !== 0) {
      lastVectorRef.current = { moveX: 0, moveY: 0 };
      onMoveChangeRef.current(0, 0);
    }
  }, [model.resetKey, model.disabled]);

  useEffect(() => {
    return () => {
      if (lastVectorRef.current.moveX !== 0 || lastVectorRef.current.moveY !== 0) {
        lastVectorRef.current = { moveX: 0, moveY: 0 };
        onMoveChangeRef.current(0, 0);
      }
    };
  }, []);

  function emitMove(nextVector: Vector2): void {
    if (!hasMeaningfulVectorChange(lastVectorRef.current, nextVector)) {
      return;
    }

    lastVectorRef.current = nextVector;
    onMoveChangeRef.current(nextVector.moveX, nextVector.moveY);
  }

  function resetStick(): void {
    activePointerIdRef.current = null;
    setThumbOffset({ x: 0, y: 0, active: false });

    if (lastVectorRef.current.moveX !== 0 || lastVectorRef.current.moveY !== 0) {
      lastVectorRef.current = { moveX: 0, moveY: 0 };
      onMoveChangeRef.current(0, 0);
    }
  }

  function updateStick(clientX: number, clientY: number): void {
    const pad = padRef.current;

    if (!pad) {
      return;
    }

    const rect = pad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDistance = Math.min(rect.width, rect.height) * 0.29;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const rawX = maxDistance > 0 ? deltaX / maxDistance : 0;
    const rawY = maxDistance > 0 ? deltaY / maxDistance : 0;
    const displayVector = clampMagnitude(rawX, rawY);
    const nextVector = applyResponseMapping(rawX, rawY);
    const knobX = displayVector.moveX * maxDistance;
    const knobY = displayVector.moveY * maxDistance;

    setThumbOffset({
      x: knobX,
      y: knobY,
      active: displayVector.moveX !== 0 || displayVector.moveY !== 0
    });
    emitMove(nextVector);
  }

  function beginPointer(event: React.PointerEvent<HTMLDivElement>): void {
    if (model.disabled) {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateStick(event.clientX, event.clientY);
  }

  function movePointer(event: React.PointerEvent<HTMLDivElement>): void {
    if (model.disabled || activePointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateStick(event.clientX, event.clientY);
  }

  function endPointer(event: React.PointerEvent<HTMLDivElement>): void {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    resetStick();
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div
        style={{
          display: "grid",
          gap: 8,
          padding: 18,
          borderRadius: 20,
          border: "1px solid var(--panel-border)",
          background: "linear-gradient(180deg, rgba(8, 47, 73, 0.32) 0%, rgba(15, 23, 42, 0.72) 100%)"
        }}
      >
        <strong style={{ fontSize: "1.25rem", color: model.accentColor ?? "var(--accent)" }}>{model.title}</strong>
        {model.subtitle ? <span style={{ color: "var(--text-muted)" }}>{model.subtitle}</span> : null}
        {model.helperText ? <span style={{ color: "var(--text-muted)" }}>{model.helperText}</span> : null}
      </div>

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: hasActionButtons ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)",
          alignItems: "center",
          gap: 16
        }}
      >
        <div
          style={{
            display: "grid",
            justifyItems: hasActionButtons ? "start" : "center",
            gap: 14
          }}
        >
          <div
            ref={padRef}
            onPointerDown={beginPointer}
            onPointerMove={movePointer}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onLostPointerCapture={endPointer}
            style={{
              position: "relative",
              width: controlSize,
              aspectRatio: "1 / 1",
              borderRadius: "999px",
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              background: model.disabled
                ? "radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.78) 0%, rgba(2, 6, 23, 0.96) 72%)"
                : "radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.18) 0%, rgba(2, 6, 23, 0.96) 74%)",
              border: `1px solid ${model.accentColor ?? "var(--panel-border)"}`,
              boxShadow: model.disabled
                ? "inset 0 0 0 1px rgba(148, 163, 184, 0.12)"
                : "inset 0 0 0 1px rgba(125, 211, 252, 0.14), 0 20px 45px rgba(2, 6, 23, 0.35)"
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "18%",
                borderRadius: "999px",
                border: "1px solid rgba(148, 163, 184, 0.16)"
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "35%",
                borderRadius: "999px",
                border: "1px solid rgba(148, 163, 184, 0.12)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "26%",
                aspectRatio: "1 / 1",
                transform: `translate(calc(-50% + ${thumbOffset.x}px), calc(-50% + ${thumbOffset.y}px))`,
                borderRadius: "999px",
                background: model.disabled
                  ? "linear-gradient(180deg, rgba(71, 85, 105, 0.86) 0%, rgba(30, 41, 59, 0.96) 100%)"
                  : `linear-gradient(180deg, ${model.accentColor ?? "var(--accent)"} 0%, rgba(8, 145, 178, 0.92) 100%)`,
                boxShadow: thumbOffset.active
                  ? "0 14px 30px rgba(8, 145, 178, 0.35)"
                  : "0 10px 24px rgba(15, 23, 42, 0.28)",
                border: "1px solid rgba(226, 232, 240, 0.22)",
                display: "grid",
                placeItems: "center",
                color: "rgba(248, 250, 252, 0.92)",
                fontWeight: 900,
                letterSpacing: "0.08em",
                fontSize: "0.72rem",
                transition: activePointerIdRef.current === null ? "transform 100ms ease-out, box-shadow 140ms ease-out" : "none"
              }}
            >
              {model.centerLabel ?? "MOVE"}
            </div>
          </div>

          <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", letterSpacing: "0.03em" }}>
            Innen fein steuern, am Rand mit voller Geschwindigkeit laufen.
          </div>
        </div>

        {hasActionButtons ? (
          <ActionButtonPad
            buttons={actionButtons}
            disabled={model.disabled}
            columns={buttonColumns}
            buttonSize={buttonSize}
          />
        ) : null}
      </div>

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
                background: stat.highlighted ? "rgba(34, 211, 238, 0.16)" : "rgba(15, 23, 42, 0.52)"
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
