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
            ? "radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.82) 0%, rgba(2, 6, 23, 0.96) 72%)"
            : "radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.2) 0%, rgba(2, 6, 23, 0.96) 74%)",
          border: `1px solid ${disabled ? "rgba(148, 163, 184, 0.22)" : accentColor}`,
          boxShadow: disabled
            ? "inset 0 0 0 1px rgba(148, 163, 184, 0.1)"
            : "inset 0 0 0 1px rgba(125, 211, 252, 0.14), 0 22px 48px rgba(2, 6, 23, 0.36)"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "10%",
            right: "10%",
            top: "50%",
            height: 2,
            background: "rgba(226, 232, 240, 0.12)"
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "10%",
            bottom: "10%",
            left: "50%",
            width: 2,
            background: "rgba(226, 232, 240, 0.12)"
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "19%",
            borderRadius: "999px",
            border: "1px solid rgba(148, 163, 184, 0.18)"
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "36%",
            borderRadius: "999px",
            border: "1px solid rgba(148, 163, 184, 0.14)"
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
              ? "linear-gradient(180deg, rgba(71, 85, 105, 0.86) 0%, rgba(30, 41, 59, 0.98) 100%)"
              : `linear-gradient(180deg, ${accentColor} 0%, rgba(8, 145, 178, 0.94) 100%)`,
            border: "1px solid rgba(226, 232, 240, 0.24)",
            boxShadow: thumbOffset.active
              ? "0 16px 34px rgba(8, 145, 178, 0.34)"
              : "0 10px 24px rgba(15, 23, 42, 0.28)",
            display: "grid",
            placeItems: "center",
            color: "#f8fafc",
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
          color: "rgba(226, 232, 240, 0.74)",
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
        border: "3px solid rgba(2, 6, 23, 0.92)",
        clipPath,
        background: disabled
          ? "linear-gradient(180deg, rgba(71, 85, 105, 0.9) 0%, rgba(30, 41, 59, 0.98) 100%)"
          : active
            ? `linear-gradient(180deg, ${color} 0%, ${color} 100%)`
            : `linear-gradient(180deg, ${color} 0%, ${color} 100%)`,
        color: "#f8fafc",
        fontWeight: 950,
        fontSize: "clamp(0.72rem, 2.6vw, 1.02rem)",
        letterSpacing: "0.04em",
        textShadow: "0 2px 8px rgba(0, 0, 0, 0.48)",
        boxShadow: active ? `0 0 26px ${color}` : "0 18px 34px rgba(2, 6, 23, 0.24)",
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
        filter: "drop-shadow(0 20px 34px rgba(2, 6, 23, 0.34))"
      }}
    >
      <TriangleButton
        label="BOOST"
        control="boost"
        active={controls.boost}
        disabled={disabled}
        color="#22c55e"
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
        color="#ef1d27"
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
        color="#3f43c9"
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
  const accentColor = model.accentColor ?? "#22d3ee";

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
