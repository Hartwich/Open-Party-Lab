import { useEffect, useRef, useState } from "react";
import type {
  RacingControlKey,
  RacingControlsLayoutModel,
  RacingControlsState
} from "./models.js";

interface RacingControlsLayoutProps {
  model: RacingControlsLayoutModel;
}

interface ThumbOffset {
  x: number;
  y: number;
  active: boolean;
}

interface Vector2 {
  x: number;
  y: number;
}

const deadzone = 0.14;
const driveThreshold = 0.28;
const steeringEpsilon = 0.015;

const idleControls: RacingControlsState = {
  steering: 0,
  throttle: false,
  brake: false,
  drift: false,
  boost: false,
  fire: false
};

function clampMagnitude(x: number, y: number): Vector2 {
  const magnitude = Math.hypot(x, y);

  if (magnitude <= 0.0001) {
    return { x: 0, y: 0 };
  }

  if (magnitude <= 1) {
    return { x, y };
  }

  return {
    x: x / magnitude,
    y: y / magnitude
  };
}

function applyDeadzone(x: number, y: number): Vector2 {
  const clamped = clampMagnitude(x, y);
  const magnitude = Math.hypot(clamped.x, clamped.y);

  if (magnitude <= deadzone) {
    return { x: 0, y: 0 };
  }

  const scaledMagnitude = (magnitude - deadzone) / (1 - deadzone);

  return {
    x: (clamped.x / magnitude) * scaledMagnitude,
    y: (clamped.y / magnitude) * scaledMagnitude
  };
}

function sameControls(a: RacingControlsState, b: RacingControlsState): boolean {
  return (
    Math.abs(a.steering - b.steering) <= steeringEpsilon &&
    a.throttle === b.throttle &&
    a.brake === b.brake &&
    a.drift === b.drift &&
    a.boost === b.boost &&
    a.fire === b.fire
  );
}

function resolveDriveControls(x: number, y: number): Pick<RacingControlsState, "steering" | "throttle" | "brake"> {
  const shaped = applyDeadzone(x, y);
  const steering = Math.abs(shaped.x) <= steeringEpsilon ? 0 : shaped.x;

  return {
    steering,
    throttle: shaped.y < -driveThreshold,
    brake: shaped.y > driveThreshold
  };
}

interface RacingStickProps {
  disabled: boolean;
  accentColor: string;
  steering: number;
  throttle: boolean;
  brake: boolean;
  onDriveChange: (controls: Pick<RacingControlsState, "steering" | "throttle" | "brake">) => void;
}

function RacingStick({ disabled, accentColor, steering, throttle, brake, onDriveChange }: RacingStickProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [thumbOffset, setThumbOffset] = useState<ThumbOffset>({ x: 0, y: 0, active: false });

  function updateStick(clientX: number, clientY: number): void {
    const pad = padRef.current;

    if (!pad) {
      return;
    }

    const rect = pad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDistance = Math.min(rect.width, rect.height) * 0.34;
    const rawX = maxDistance > 0 ? (clientX - centerX) / maxDistance : 0;
    const rawY = maxDistance > 0 ? (clientY - centerY) / maxDistance : 0;
    const display = clampMagnitude(rawX, rawY);

    setThumbOffset({
      x: display.x * maxDistance,
      y: display.y * maxDistance,
      active: display.x !== 0 || display.y !== 0
    });
    onDriveChange(resolveDriveControls(rawX, rawY));
  }

  function resetStick(): void {
    pointerIdRef.current = null;
    setThumbOffset({ x: 0, y: 0, active: false });
    onDriveChange({
      steering: 0,
      throttle: false,
      brake: false
    });
  }

  function beginPointer(event: React.PointerEvent<HTMLDivElement>): void {
    if (disabled) {
      return;
    }

    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateStick(event.clientX, event.clientY);
  }

  function movePointer(event: React.PointerEvent<HTMLDivElement>): void {
    if (disabled || pointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateStick(event.clientX, event.clientY);
  }

  function endPointer(event: React.PointerEvent<HTMLDivElement>): void {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    resetStick();
  }

  const label = throttle ? "GAS" : brake ? "REV" : "DRIVE";

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        gap: 10,
        minWidth: 0
      }}
    >
      <div
        ref={padRef}
        aria-label="Drive stick"
        role="application"
        onPointerDown={beginPointer}
        onPointerMove={movePointer}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onLostPointerCapture={endPointer}
        style={{
          position: "relative",
          width: "min(43vw, 62dvh, 270px)",
          minWidth: 150,
          aspectRatio: "1 / 1",
          borderRadius: "999px",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          background: disabled
            ? "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--surface-raised) 82%, transparent) 0%, color-mix(in srgb, var(--paper) 96%, transparent) 72%)"
            : "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent) 20%, transparent) 0%, color-mix(in srgb, var(--paper) 96%, transparent) 74%)",
          border: `1px solid ${disabled ? "color-mix(in srgb, var(--muted) 22%, transparent)" : accentColor}`,
          boxShadow: disabled
            ? "inset 0 0 0 1px color-mix(in srgb, var(--muted) 10%, transparent)"
            : "inset 0 0 0 1px color-mix(in srgb, var(--accent) 14%, transparent), 0 22px 48px color-mix(in srgb, var(--paper) 36%, transparent)"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "10%",
            right: "10%",
            top: "50%",
            height: 2,
            background: "color-mix(in srgb, var(--ink-soft) 12%, transparent)"
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "10%",
            bottom: "10%",
            left: "50%",
            width: 2,
            background: "color-mix(in srgb, var(--ink-soft) 12%, transparent)"
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "19%",
            borderRadius: "999px",
            border: "1px solid color-mix(in srgb, var(--muted) 18%, transparent)"
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "36%",
            borderRadius: "999px",
            border: "1px solid color-mix(in srgb, var(--muted) 14%, transparent)"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "29%",
            aspectRatio: "1 / 1",
            transform: `translate(calc(-50% + ${thumbOffset.x}px), calc(-50% + ${thumbOffset.y}px))`,
            borderRadius: "999px",
            background: disabled
              ? "linear-gradient(180deg, color-mix(in srgb, var(--line-strong) 86%, transparent) 0%, color-mix(in srgb, var(--surface-raised) 98%, transparent) 100%)"
              : `linear-gradient(180deg, ${accentColor} 0%, color-mix(in srgb, var(--accent-strong) 94%, transparent) 100%)`,
            border: "1px solid color-mix(in srgb, var(--ink-soft) 24%, transparent)",
            boxShadow: thumbOffset.active
              ? "0 16px 34px color-mix(in srgb, var(--accent-strong) 34%, transparent)"
              : "0 10px 24px color-mix(in srgb, var(--surface) 28%, transparent)",
            display: "grid",
            placeItems: "center",
            color: "var(--ink)",
            fontWeight: 950,
            fontSize: "clamp(0.68rem, 2.2vw, 0.9rem)",
            letterSpacing: "0.06em",
            transition: pointerIdRef.current === null ? "transform 100ms ease-out, box-shadow 140ms ease-out" : "none"
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          minHeight: 18,
          color: "color-mix(in srgb, var(--ink-soft) 74%, transparent)",
          fontSize: "clamp(0.72rem, 2.5vw, 0.92rem)",
          fontWeight: 800,
          letterSpacing: "0.06em"
        }}
      >
        {steering < -0.18 ? "LEFT" : steering > 0.18 ? "RIGHT" : throttle ? "FORWARD" : brake ? "REVERSE" : "READY"}
      </div>
    </div>
  );
}

interface TriangleButtonProps {
  label: string;
  control: RacingControlKey;
  active: boolean;
  disabled: boolean;
  color: string;
  clipPath: string;
  style: React.CSSProperties;
  labelTop: string;
  onChange: (control: RacingControlKey, active: boolean) => void;
}

function TriangleButton({
  label,
  control,
  active,
  disabled,
  color,
  clipPath,
  style,
  labelTop,
  onChange
}: TriangleButtonProps) {
  const pointerIdRef = useRef<number | null>(null);

  function press(event: React.PointerEvent<HTMLButtonElement>): void {
    if (disabled) {
      return;
    }

    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(control, true);
  }

  function release(event: React.PointerEvent<HTMLButtonElement>): void {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    pointerIdRef.current = null;
    onChange(control, false);
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      style={{
        position: "absolute",
        padding: 0,
        border: "3px solid color-mix(in srgb, var(--paper) 92%, transparent)",
        clipPath,
        background: disabled
          ? "linear-gradient(180deg, color-mix(in srgb, var(--line-strong) 90%, transparent) 0%, color-mix(in srgb, var(--surface-raised) 98%, transparent) 100%)"
          : active
            ? `linear-gradient(180deg, ${color} 0%, ${color} 100%)`
            : `linear-gradient(180deg, ${color} 0%, ${color} 100%)`,
        color: "var(--ink)",
        fontWeight: 950,
        fontSize: "clamp(0.72rem, 2.6vw, 1.02rem)",
        letterSpacing: "0.04em",
        textShadow: "0 2px 8px color-mix(in srgb, var(--paper) 48%, transparent)",
        boxShadow: active ? `0 0 26px ${color}` : "0 18px 34px color-mix(in srgb, var(--paper) 24%, transparent)",
        touchAction: "none",
        WebkitTapHighlightColor: "transparent",
        ...style
      }}
    >
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: labelTop,
          transform: "translate(-50%, -50%)",
          lineHeight: 1,
          whiteSpace: "nowrap"
        }}
      >
        {label}
      </span>
    </button>
  );
}

interface ActionTriangleProps {
  controls: RacingControlsState;
  disabled: boolean;
  onButtonChange: (control: RacingControlKey, active: boolean) => void;
}

function ActionTriangle({ controls, disabled, onButtonChange }: ActionTriangleProps) {
  return (
    <div
      aria-label="Race actions"
      style={{
        position: "relative",
        width: "min(43vw, 60dvh, 280px)",
        minWidth: 156,
        aspectRatio: "1 / 0.92",
        filter: "drop-shadow(0 20px 34px color-mix(in srgb, var(--paper) 34%, transparent))"
      }}
    >
      <TriangleButton
        label="BOOST"
        control="boost"
        active={controls.boost}
        disabled={disabled}
        color="var(--sage)"
        clipPath="polygon(50% 0%, 100% 100%, 0% 100%)"
        labelTop="72%"
        style={{
          left: "24%",
          top: "0%",
          width: "52%",
          height: "58%",
          zIndex: 3
        }}
        onChange={onButtonChange}
      />
      <TriangleButton
        label="FIRE"
        control="fire"
        active={controls.fire}
        disabled={disabled}
        color="var(--danger)"
        clipPath="polygon(0% 100%, 100% 100%, 94% 0%)"
        labelTop="76%"
        style={{
          left: "0%",
          bottom: "0%",
          width: "55%",
          height: "54%",
          zIndex: 2
        }}
        onChange={onButtonChange}
      />
      <TriangleButton
        label="DRIFT"
        control="drift"
        active={controls.drift}
        disabled={disabled}
        color="var(--accent)"
        clipPath="polygon(6% 0%, 100% 100%, 0% 100%)"
        labelTop="76%"
        style={{
          right: "0%",
          bottom: "0%",
          width: "55%",
          height: "54%",
          zIndex: 2
        }}
        onChange={onButtonChange}
      />
    </div>
  );
}

export function RacingControlsLayout({ model }: RacingControlsLayoutProps) {
  const [controls, setControls] = useState<RacingControlsState>(idleControls);
  const controlsRef = useRef(controls);
  const onControlsChangeRef = useRef(model.onControlsChange);
  const accentColor = model.accentColor ?? "var(--accent)";

  useEffect(() => {
    onControlsChangeRef.current = model.onControlsChange;
  }, [model.onControlsChange]);

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  function emitControls(nextControls: RacingControlsState): void {
    if (sameControls(controlsRef.current, nextControls)) {
      return;
    }

    controlsRef.current = nextControls;
    setControls(nextControls);
    onControlsChangeRef.current(nextControls);
  }

  useEffect(() => {
    controlsRef.current = idleControls;
    setControls(idleControls);
    onControlsChangeRef.current(idleControls);
  }, [model.resetKey, model.disabled]);

  useEffect(() => {
    return () => {
      onControlsChangeRef.current(idleControls);
    };
  }, []);

  function updateDrive(driveControls: Pick<RacingControlsState, "steering" | "throttle" | "brake">): void {
    emitControls({
      ...controlsRef.current,
      ...driveControls
    });
  }

  function updateButton(control: RacingControlKey, active: boolean): void {
    emitControls({
      ...controlsRef.current,
      [control]: active
    });
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(156px, 1fr) minmax(156px, 1fr)",
        alignItems: "center",
        justifyItems: "center",
        gap: 14,
        height: "min(80dvh, 430px)",
        minHeight: 240,
        width: "100%",
        touchAction: "none"
      }}
    >
      <RacingStick
        disabled={model.disabled}
        accentColor={accentColor}
        steering={controls.steering}
        throttle={controls.throttle}
        brake={controls.brake}
        onDriveChange={updateDrive}
      />
      <ActionTriangle controls={controls} disabled={model.disabled} onButtonChange={updateButton} />
    </div>
  );
}
