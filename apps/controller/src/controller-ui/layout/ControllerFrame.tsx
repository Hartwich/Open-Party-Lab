import type { PropsWithChildren, ReactNode } from "react";

interface ControllerFrameProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  wide?: boolean;
  bare?: boolean;
}

export function ControllerFrame({ title, subtitle, footer, wide = false, bare = false, children }: ControllerFrameProps) {
  return (
    <main
      style={{
        display: "grid",
        gap: bare ? 0 : wide ? 8 : 14,
        maxWidth: bare ? "none" : wide ? 1040 : 680,
        width: "100%",
        minHeight: bare ? "min(82vh, 760px)" : undefined,
        margin: "0 auto",
        background: bare ? "transparent" : wide ? "color-mix(in srgb, var(--paper) 64%, transparent)" : "var(--panel-bg)",
        border: bare ? "0" : wide ? "1px solid color-mix(in srgb, var(--muted) 14%, transparent)" : "1px solid var(--panel-border)",
        borderRadius: bare ? 0 : wide ? 18 : "var(--radius-lg)",
        padding: bare ? 0 : wide ? 8 : 14,
        boxShadow: bare ? "none" : wide ? "0 18px 36px color-mix(in srgb, var(--paper) 24%, transparent)" : "var(--button-shadow)",
        backdropFilter: bare ? "none" : "blur(10px)"
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
