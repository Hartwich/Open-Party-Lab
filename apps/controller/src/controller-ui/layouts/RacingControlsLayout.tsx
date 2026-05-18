import { useEffect, useRef, useState } from "react";
import type {
  RacingControlKey,
  RacingControlsLayoutModel,
  RacingControlsState
} from "./models.js";

interface RacingControlsLayoutProps {
  model: RacingControlsLayoutModel;
}

type ActiveControls = Record<RacingControlKey, boolean>;

const idleControls: ActiveControls = {
  left: false,
  right: false,
  throttle: false,
  brake: false,
  drift: false,
  boost: false
};

function toControls(active: ActiveControls): RacingControlsState {
  const steering = active.left === active.right ? 0 : active.left ? -1 : 1;

  return {
    steering,
    throttle: active.throttle,
    brake: active.brake,
    drift: active.drift,
    boost: active.boost
  };
}

function sameActiveControls(a: ActiveControls, b: ActiveControls): boolean {
  return (
    a.left === b.left &&
    a.right === b.right &&
    a.throttle === b.throttle &&
    a.brake === b.brake &&
    a.drift === b.drift &&
    a.boost === b.boost
  );
}

interface HoldPadProps {
  label: string;
  control: RacingControlKey;
  active: boolean;
  disabled: boolean;
  accentColor: string;
  onChange: (control: RacingControlKey, active: boolean) => void;
}

function HoldPad({ label, control, active, disabled, accentColor, onChange }: HoldPadProps) {
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
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={(event) => {
        if (pointerIdRef.current !== event.pointerId) {
          return;
        }

        pointerIdRef.current = null;
        onChange(control, false);
      }}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 86,
        border: active ? `2px solid ${accentColor}` : "1px solid rgba(226, 232, 240, 0.18)",
        borderRadius: 18,
        background: disabled
          ? "rgba(30, 41, 59, 0.78)"
          : active
            ? `linear-gradient(180deg, ${accentColor} 0%, rgba(8, 145, 178, 0.94) 100%)`
            : "linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)",
        color: disabled ? "rgba(226, 232, 240, 0.46)" : "#f8fafc",
        fontWeight: 950,
        fontSize: "clamp(1.25rem, 5.2vw, 2.3rem)",
        letterSpacing: 0,
        boxShadow: active ? "0 18px 34px rgba(34, 211, 238, 0.18)" : "inset 0 0 0 1px rgba(148, 163, 184, 0.08)",
        touchAction: "none",
        WebkitTapHighlightColor: "transparent"
      }}
    >
      {label}
    </button>
  );
}

export function RacingControlsLayout({ model }: RacingControlsLayoutProps) {
  const [activeControls, setActiveControls] = useState<ActiveControls>(idleControls);
  const activeControlsRef = useRef(activeControls);
  const onControlsChangeRef = useRef(model.onControlsChange);
  const accentColor = model.accentColor ?? "#22d3ee";

  useEffect(() => {
    onControlsChangeRef.current = model.onControlsChange;
  }, [model.onControlsChange]);

  useEffect(() => {
    activeControlsRef.current = activeControls;
  }, [activeControls]);

  useEffect(() => {
    activeControlsRef.current = idleControls;
    setActiveControls(idleControls);
    onControlsChangeRef.current(toControls(idleControls));
  }, [model.resetKey, model.disabled]);

  useEffect(() => {
    return () => {
      onControlsChangeRef.current(toControls(idleControls));
    };
  }, []);

  function updateControl(control: RacingControlKey, active: boolean): void {
    const nextControls = {
      ...activeControlsRef.current,
      [control]: active
    };

    if (sameActiveControls(activeControlsRef.current, nextControls)) {
      return;
    }

    activeControlsRef.current = nextControls;
    setActiveControls(nextControls);
    onControlsChangeRef.current(toControls(nextControls));
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(220px, 0.95fr) minmax(280px, 1.2fr)",
        gap: 10,
        height: "min(78dvh, 390px)",
        minHeight: 260,
        width: "100%",
        touchAction: "none"
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <HoldPad
          label="<"
          control="left"
          active={activeControls.left}
          disabled={model.disabled}
          accentColor={accentColor}
          onChange={updateControl}
        />
        <HoldPad
          label=">"
          control="right"
          active={activeControls.right}
          disabled={model.disabled}
          accentColor={accentColor}
          onChange={updateControl}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <HoldPad
          label="GAS"
          control="throttle"
          active={activeControls.throttle}
          disabled={model.disabled}
          accentColor="#22c55e"
          onChange={updateControl}
        />
        <HoldPad
          label="BOOST"
          control="boost"
          active={activeControls.boost}
          disabled={model.disabled}
          accentColor="#f97316"
          onChange={updateControl}
        />
        <HoldPad
          label="BRK"
          control="brake"
          active={activeControls.brake}
          disabled={model.disabled}
          accentColor="#ef4444"
          onChange={updateControl}
        />
        <HoldPad
          label="DRIFT"
          control="drift"
          active={activeControls.drift}
          disabled={model.disabled}
          accentColor={accentColor}
          onChange={updateControl}
        />
      </div>
    </div>
  );
}
