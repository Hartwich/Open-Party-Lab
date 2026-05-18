import type { PropsWithChildren, ReactNode } from "react";

interface ControllerFrameProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  wide?: boolean;
}

export function ControllerFrame({ title, subtitle, footer, wide = false, children }: ControllerFrameProps) {
  return (
    <main
      style={{
        display: "grid",
        gap: wide ? 8 : 14,
        maxWidth: wide ? 1040 : 680,
        width: "100%",
        margin: "0 auto",
        background: wide ? "rgba(2, 6, 23, 0.64)" : "var(--panel-bg)",
        border: wide ? "1px solid rgba(148, 163, 184, 0.14)" : "1px solid var(--panel-border)",
        borderRadius: wide ? 18 : "var(--radius-lg)",
        padding: wide ? 8 : 14,
        boxShadow: wide ? "0 18px 36px rgba(2, 6, 23, 0.24)" : "var(--button-shadow)",
        backdropFilter: "blur(10px)"
      }}
    >
      {title || subtitle ? (
        <header>
          {title ? <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>{title}</h1> : null}
          {subtitle ? <p style={{ margin: "6px 0 0", color: "var(--text-muted)" }}>{subtitle}</p> : null}
        </header>
      ) : null}
      <section>{children}</section>
      {footer ? <footer>{footer}</footer> : null}
    </main>
  );
}
