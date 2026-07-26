import type { PropsWithChildren, ReactNode } from "react";

interface ControllerFrameProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  wide?: boolean;
  bare?: boolean;
  fitViewport?: boolean;
}

export function ControllerFrame({ title, subtitle, footer, wide = false, bare = false, fitViewport = false, children }: ControllerFrameProps) {
  return (
    <main
      style={{
        display: "grid",
        gap: bare ? 0 : wide ? 8 : 14,
        maxWidth: bare ? "none" : wide ? 1040 : 680,
        width: "100%",
        height: fitViewport
          ? "calc(100dvh - max(10px, env(safe-area-inset-top)) - max(10px, env(safe-area-inset-bottom)))"
          : undefined,
        minHeight: bare ? "min(82vh, 760px)" : undefined,
        overflow: fitViewport ? "hidden" : undefined,
        gridTemplateRows: fitViewport ? "auto minmax(0, 1fr) auto" : undefined,
        margin: "0 auto",
        background: bare ? "transparent" : wide ? "rgba(2, 6, 23, 0.64)" : "var(--panel-bg)",
        border: bare ? "0" : wide ? "1px solid rgba(148, 163, 184, 0.14)" : "1px solid var(--panel-border)",
        borderRadius: bare ? 0 : wide ? 18 : "var(--radius-lg)",
        padding: bare ? 0 : wide ? 8 : 14,
        boxShadow: bare ? "none" : wide ? "0 18px 36px rgba(2, 6, 23, 0.24)" : "var(--button-shadow)",
        backdropFilter: bare ? "none" : "blur(10px)"
      }}
    >
      {title || subtitle ? (
        <header>
          {title ? <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>{title}</h1> : null}
          {subtitle ? <p style={{ margin: "6px 0 0", color: "var(--text-muted)" }}>{subtitle}</p> : null}
        </header>
      ) : null}
      <section style={fitViewport ? { minHeight: 0, display: "grid" } : undefined}>{children}</section>
      {footer ? <footer>{footer}</footer> : null}
    </main>
  );
}
