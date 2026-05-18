import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export function BigButton({
  children,
  style,
  ...buttonProps
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      {...buttonProps}
      style={{
        width: "100%",
        minHeight: 220,
        border: 0,
        borderRadius: "32px",
        background: "linear-gradient(160deg, var(--accent) 0%, var(--accent-strong) 100%)",
        color: "#082f49",
        fontSize: "clamp(2rem, 9vw, 4rem)",
        fontWeight: 900,
        boxShadow: "var(--button-shadow)",
        ...style
      }}
    >
      {children}
    </button>
  );
}
