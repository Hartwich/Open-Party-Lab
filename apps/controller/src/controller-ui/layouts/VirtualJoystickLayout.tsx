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

/**
 * While the thumb holds a direction, the current vector is repeated at this
 * interval. Stick updates go out as volatile packets that may be dropped under
 * load; without a repeat a lost packet would stay lost until the thumb moves.
 */
const HOLD_REPEAT_MS = 150;

/**
 * Height left for the controller once SafeAreaLayout has applied its padding.
 * Keep in sync with the padding in `layout/SafeAreaLayout.tsx`.
 */
const SAFE_VIEWPORT_HEIGHT =
  "calc(100dvh - max(10px, env(safe-area-inset-top)) - max(10px, env(safe-area-inset-bottom)))";

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
  const holdRepeatRef = useRef<number | null>(null);
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0, active: false });
  const minimal = Boolean(model.minimal);
  const cleanChrome = Boolean(model.cleanChrome);
  const actionButtons = minimal ? [] : model.actionButtons ?? [];
  const buttonColumns =
    model.actionButtonColumns ??
    (actionButtons.length >= 4 ? 2 : 1);
  const hasActionButtons = actionButtons.length > 0;
  // Only the minimal (stick-only) variant can be anchored; the richer variants
  // stack panels and stats around the stick and keep their flow layout.
  const anchorBottom = minimal && model.stickPlacement === "bottom";
  const controlSize = minimal
    ? anchorBottom
      ? "min(84vw, 360px, 70dvh)"
      : "min(84vw, 360px)"
    : cleanChrome
      ? "clamp(170px, min(48vw, 62dvh), 360px)"
      : hasActionButtons ? "min(42vw, 220px)" : "min(78vw, 320px)";
  const buttonSize =
    actionButtons.length >= 4
      ? "min(19vw, 96px)"
      : cleanChrome
        ? "clamp(150px, min(43vw, 50dvh), 300px)"
        : "min(34vw, 180px)";

  useEffect(() => {
    onMoveChangeRef.current = model.onMoveChange;
  }, [model.onMoveChange]);

  useEffect(() => {
    activePointerIdRef.current = null;
    stopHoldRepeat();
    setThumbOffset({ x: 0, y: 0, active: false });

    if (lastVectorRef.current.moveX !== 0 || lastVectorRef.current.moveY !== 0) {
      lastVectorRef.current = { moveX: 0, moveY: 0 };
      onMoveChangeRef.current(0, 0);
    }
  }, [model.resetKey, model.disabled]);

  useEffect(() => {
    return () => {
      stopHoldRepeat();

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

  function startHoldRepeat(): void {
    if (holdRepeatRef.current !== null) {
      return;
    }

    holdRepeatRef.current = window.setInterval(() => {
      const vector = lastVectorRef.current;

      if (activePointerIdRef.current !== null && (vector.moveX !== 0 || vector.moveY !== 0)) {
        onMoveChangeRef.current(vector.moveX, vector.moveY);
      }
    }, HOLD_REPEAT_MS);
  }

  function stopHoldRepeat(): void {
    if (holdRepeatRef.current === null) {
      return;
    }

    window.clearInterval(holdRepeatRef.current);
    holdRepeatRef.current = null;
  }

  function resetStick(): void {
    activePointerIdRef.current = null;
    stopHoldRepeat();
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
    startHoldRepeat();
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
    <div
      style={{
        display: "grid",
        gap: minimal ? 0 : cleanChrome ? 12 : 18,
        minHeight: anchorBottom
          ? SAFE_VIEWPORT_HEIGHT
          : minimal ? "min(76vh, 680px)" : undefined,
        alignContent: anchorBottom ? "end" : cleanChrome ? "center" : undefined,
        // Longhands instead of `placeItems`, so React never has to reconcile a
        // shorthand against a longhand when the placement changes.
        alignItems: minimal && !anchorBottom ? "center" : undefined,
        justifyItems: minimal ? "center" : undefined,
        // A little air above the lower edge keeps the pad clear of the
        // system gesture bar while the thumb can still pull fully downwards.
        paddingBottom: anchorBottom ? "max(12px, 3dvh)" : undefined
      }}
    >
      {!minimal && !cleanChrome ? <div
        style={{
          display: "grid",
          gap: 8,
          padding: 18,
          borderRadius: 20,
          border: "1px solid var(--panel-border)",
          background: "linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 32%, transparent) 0%, color-mix(in srgb, var(--surface) 72%, transparent) 100%)"
        }}
      >
        <strong style={{ fontSize: "1.25rem", color: model.accentColor ?? "var(--accent)" }}>{model.title}</strong>
        {model.subtitle ? <span style={{ color: "var(--text-muted)" }}>{model.subtitle}</span> : null}
        {model.helperText ? <span style={{ color: "var(--text-muted)" }}>{model.helperText}</span> : null}
      </div> : null}

      {!minimal && !cleanChrome && model.ready ? <ReadyPanel ready={model.ready} /> : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: hasActionButtons ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)",
          alignItems: "center",
          gap: cleanChrome ? 12 : 16
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
                ? "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--surface-raised) 78%, transparent) 0%, color-mix(in srgb, var(--paper) 96%, transparent) 72%)"
                : "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, color-mix(in srgb, var(--paper) 96%, transparent) 74%)",
              border: `1px solid ${model.accentColor ?? "var(--panel-border)"}`,
              boxShadow: model.disabled
                ? "inset 0 0 0 1px color-mix(in srgb, var(--muted) 12%, transparent)"
                : "inset 0 0 0 1px color-mix(in srgb, var(--accent) 14%, transparent), 0 20px 45px color-mix(in srgb, var(--paper) 35%, transparent)"
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "18%",
                borderRadius: "999px",
                border: "1px solid color-mix(in srgb, var(--muted) 16%, transparent)"
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "35%",
                borderRadius: "999px",
                border: "1px solid color-mix(in srgb, var(--muted) 12%, transparent)"
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
                  ? "linear-gradient(180deg, color-mix(in srgb, var(--line-strong) 86%, transparent) 0%, color-mix(in srgb, var(--surface-raised) 96%, transparent) 100%)"
                  : `linear-gradient(180deg, ${model.accentColor ?? "var(--accent)"} 0%, color-mix(in srgb, var(--accent-strong) 92%, transparent) 100%)`,
                boxShadow: thumbOffset.active
                  ? "0 14px 30px color-mix(in srgb, var(--accent-strong) 35%, transparent)"
                  : "0 10px 24px color-mix(in srgb, var(--surface) 28%, transparent)",
                border: "1px solid color-mix(in srgb, var(--ink-soft) 22%, transparent)",
                display: "grid",
                placeItems: "center",
                color: "color-mix(in srgb, var(--ink) 92%, transparent)",
                fontWeight: 900,
                letterSpacing: "0.08em",
                fontSize: "0.72rem",
                transition: activePointerIdRef.current === null ? "transform 100ms ease-out, box-shadow 140ms ease-out" : "none"
              }}
            >
              {minimal ? null : model.centerLabel ?? "MOVE"}
            </div>
          </div>

          {!minimal && !cleanChrome ? <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", letterSpacing: "0.03em" }}>
            {model.stickHint ?? "Innen fein steuern, am Rand mit voller Geschwindigkeit laufen."}
          </div> : null}
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

      {!minimal && !cleanChrome && model.stats?.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {model.stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: stat.highlighted ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "color-mix(in srgb, var(--surface) 52%, transparent)"
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
