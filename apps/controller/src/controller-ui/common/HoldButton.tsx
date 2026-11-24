import { useCallback, useEffect, useRef, useState } from "react";

interface HoldButtonProps {
  label: string;
  direction: "left" | "right";
  disabled?: boolean;
  accentColor?: string;
  onHoldChange: (active: boolean) => void;
}

type Source = number | "keyboard";

export function HoldButton({ label, direction, disabled = false, accentColor, onHoldChange }: HoldButtonProps) {
  const [active, setActive] = useState(false);
  const held = useRef<{ source: Source; send: HoldButtonProps["onHoldChange"] } | null>(null);

  function press(source: Source): void {
    if (disabled || held.current) return;
    held.current = { source, send: onHoldChange };
    setActive(true);
    onHoldChange(true);
  }

  const release = useCallback((source?: Source) => {
    const previous = held.current;
    if (!previous || (source !== undefined && source !== previous.source)) return;
    held.current = null;
    previous.send(false);
    setActive(false);
  }, []);

  useEffect(() => {
    const reset = () => release();
    const onVisibility = () => {
      if (document.hidden) reset();
    };
    window.addEventListener("blur", reset);
    window.addEventListener("pagehide", reset);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", reset);
      window.removeEventListener("pagehide", reset);
      document.removeEventListener("visibilitychange", onVisibility);
      const previous = held.current;
      held.current = null;
      previous?.send(false);
    };
  }, [release]);

  useEffect(() => {
    if (disabled) release();
  }, [disabled, release]);

  const accent = accentColor ?? "#72d9fc";
  const activationKey = (key: string) => key === " " || key === "Enter";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      onPointerDown={(event) => {
        if (event.button !== 0 || held.current) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        press(event.pointerId);
      }}
      onPointerUp={(event) => release(event.pointerId)}
      onPointerCancel={(event) => release(event.pointerId)}
      onLostPointerCapture={(event) => release(event.pointerId)}
      onBlur={() => release("keyboard")}
      onKeyDown={(event) => {
        if (!activationKey(event.key)) return;
        event.preventDefault();
        press("keyboard");
      }}
      onKeyUp={(event) => {
        if (!activationKey(event.key)) return;
        event.preventDefault();
        release("keyboard");
      }}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        width: "100%",
        display: "grid",
        alignContent: "center",
        justifyItems: "center",
        gap: 10,
        minHeight: "clamp(102px, 29svh, 236px)",
        borderRadius: 13,
        border: `1px solid color-mix(in srgb, ${accent} ${active ? 90 : 45}%, #252a40)`,
        background: active
          ? `color-mix(in srgb, ${accent} 38%, #111527)`
          : "linear-gradient(155deg, #1e2339, #101323)",
        boxShadow: active ? `inset 0 -3px 0 ${accent}, 0 0 18px color-mix(in srgb, ${accent} 32%, transparent)` : "inset 0 -3px 0 #080a15",
        color: "#f3f6ff",
        fontSize: "clamp(0.83rem, 3vw, 1.15rem)",
        fontWeight: 750,
        opacity: disabled ? 0.48 : 1,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        transform: active ? "translateY(2px)" : undefined
      }}
    >
      <svg aria-hidden="true" width="40" height="30" viewBox="0 0 40 30" fill="none" style={{ color: accent }}>
        <path
          d={direction === "left" ? "M33 15H7m0 0 10-10M7 15l10 10" : "M7 15h26m0 0L23 5m10 10L23 25"}
          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
