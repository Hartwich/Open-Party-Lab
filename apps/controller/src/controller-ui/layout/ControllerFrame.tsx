import type { PropsWithChildren, ReactNode } from "react";
import { LDC_CLUB } from "@open-party-lab/game-core";

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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <img
              src={`${import.meta.env.BASE_URL}ldc-logo.jpg`}
              alt={`${LDC_CLUB.name} logo`}
              width={36}
              height={36}
              style={{ borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)" }}
            />
            <div style={{ display: "grid", lineHeight: 1.2 }}>
              <strong style={{ fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {LDC_CLUB.tagline}
              </strong>
              <a
                href={LDC_CLUB.instagramUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
              >
                {LDC_CLUB.instagramLabel}
              </a>
            </div>
          </div>
          {title ? <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>{title}</h1> : null}
          {subtitle ? <p style={{ margin: "6px 0 0", color: "var(--text-muted)" }}>{subtitle}</p> : null}
        </header>
      ) : null}
      <section>{children}</section>
      {footer ? <footer>{footer}</footer> : null}
      <footer style={{ marginTop: 6, textAlign: "center", color: "var(--text-muted)", fontSize: 11, lineHeight: 1.5 }}>
        {LDC_CLUB.footerCredit} ·{" "}
        <a href={LDC_CLUB.instagramUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 700 }}>
          {LDC_CLUB.instagramLabel}
        </a>
      </footer>
    </main>
  );
}
