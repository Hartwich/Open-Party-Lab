import { useState } from "react";

interface HoldButtonProps {
  label: string;
  disabled?: boolean;
  accentColor?: string;
  onHoldChange: (active: boolean) => void;
}

export function HoldButton({ label, disabled = false, accentColor, onHoldChange }: HoldButtonProps) {
  const [active, setActive] = useState(false);

  function updateHoldState(nextActive: boolean): void {
    if (disabled) {
      if (active) {
        setActive(false);
        onHoldChange(false);
      }

      return;
    }

    if (nextActive === active) {
      return;
    }

    setActive(nextActive);
    onHoldChange(nextActive);
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        updateHoldState(true);
      }}
      onPointerUp={() => updateHoldState(false)}
      onPointerCancel={() => updateHoldState(false)}
      onPointerLeave={() => updateHoldState(false)}
      onLostPointerCapture={() => updateHoldState(false)}
      style={{
        width: "100%",
        minHeight: 160,
        borderRadius: 24,
        border: "1px solid var(--panel-border)",
        background: active
          ? accentColor ?? "linear-gradient(160deg, var(--accent) 0%, var(--accent-strong) 100%)"
          : "rgba(15, 23, 42, 0.72)",
        color: "var(--text-main)",
        fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
        fontWeight: 800,
        opacity: disabled ? 0.45 : 1,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        transition: "transform 120ms ease, opacity 120ms ease, background 120ms ease",
        transform: active ? "translateY(2px) scale(0.99)" : "translateY(0) scale(1)"
      }}
    >
      {label}
    </button>
  );
}
