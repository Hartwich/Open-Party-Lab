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
              border: "1px solid rgba(125, 211, 252, 0.3)",
              background: buttonDisabled
                ? "linear-gradient(180deg, rgba(71, 85, 105, 0.9) 0%, rgba(51, 65, 85, 1) 100%)"
                : `linear-gradient(180deg, ${button.accentColor ?? "#22d3ee"} 0%, rgba(8, 145, 178, 0.92) 100%)`,
              color: buttonDisabled ? "rgba(226, 232, 240, 0.72)" : "#f8fafc",
              fontWeight: 900,
              fontSize: "clamp(1rem, 4vw, 1.3rem)",
              letterSpacing: "0.08em",
              boxShadow: buttonDisabled ? "none" : "0 16px 34px rgba(8, 145, 178, 0.22)"
            }}
          >
            {button.label}
          </button>
        );
      })}
    </div>
  );
}
