import type { ControllerActionButtonModel } from "../layouts/models.js";

interface ActionButtonPadProps {
  buttons: ControllerActionButtonModel[];
  disabled: boolean;
  columns?: 1 | 2 | 3 | 4;
  buttonSize: string;
  justify?: "start" | "center" | "end";
}

export function ActionButtonPad({
  buttons,
  disabled,
  columns = 2,
  buttonSize,
  justify = "end"
}: ActionButtonPadProps) {
  if (buttons.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, ${buttonSize})`,
        gap: 12,
        justifyContent: justify
      }}
    >
      {buttons.map((button) => {
        const buttonDisabled = disabled || button.disabled === true;

        return (
          <button
            key={button.id}
            type="button"
            disabled={buttonDisabled}
            onPointerDown={(event) => {
              if (buttonDisabled) {
                return;
              }

              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              button.onPress();
            }}
            onPointerUp={() => {
              button.onRelease?.();
            }}
            onPointerCancel={() => {
              button.onRelease?.();
            }}
            onLostPointerCapture={() => {
              button.onRelease?.();
            }}
            style={{
              width: buttonSize,
              aspectRatio: "1 / 1",
              borderRadius: "999px",
              border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
              background: buttonDisabled
                ? "linear-gradient(180deg, color-mix(in srgb, var(--line-strong) 90%, transparent) 0%, var(--line-strong) 100%)"
                : `linear-gradient(180deg, ${button.accentColor ?? "var(--accent)"} 0%, color-mix(in srgb, var(--accent-strong) 92%, transparent) 100%)`,
              color: buttonDisabled ? "color-mix(in srgb, var(--ink-soft) 72%, transparent)" : "var(--ink)",
              fontWeight: 900,
              fontSize: "clamp(1rem, 4vw, 1.3rem)",
              letterSpacing: "0.08em",
              boxShadow: buttonDisabled ? "none" : "0 16px 34px color-mix(in srgb, var(--accent-strong) 22%, transparent)"
            }}
          >
            {button.label}
          </button>
        );
      })}
    </div>
  );
}
