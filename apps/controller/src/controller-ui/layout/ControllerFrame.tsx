import type { PropsWithChildren, ReactNode } from "react";
import { LDC_CLUB } from "@open-party-lab/game-core";

interface ControllerFrameProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  wide?: boolean;
  bare?: boolean;
  /**
   * "parchment" is the Greed-Island cream card (default, suits game screens).
   * "night" is the dark landing-page card (entry, lobby).
   */
  tone?: "parchment" | "night";
}

/**
 * Welcome Day frame: a Greed-Island adventure card.
 *
 * Cream parchment surface with a gold border on the dark adventure backdrop.
 * `bare`/`minimal` modes are untouched — games that need a clean frame keep
 * exactly what they had.
 */
export function ControllerFrame({ title, subtitle, footer, wide = false, bare = false, tone = "parchment", children }: ControllerFrameProps) {
  if (bare) {
    return (
      <main
        style={{
          display: "grid",
          gap: 0,
          width: "100%",
          minHeight: "min(82vh, 760px)",
          margin: "0 auto",
          background: "transparent",
          border: 0,
          borderRadius: 0,
          padding: 0,
          boxShadow: "none"
        }}
      >
        <section>{children}</section>
        {footer ? <footer>{footer}</footer> : null}
      </main>
    );
  }

  const night = tone === "night";

  return (
    <main
      className="hxh-scope"
      style={{
        position: "relative",
        display: "grid",
        gap: wide ? 8 : 14,
        maxWidth: wide ? 1040 : 560,
        width: "100%",
        margin: "0 auto",
        background: night
          ? "linear-gradient(135deg, rgba(251,241,214,.1), rgba(251,241,214,.03) 45%, rgba(8,40,30,.94))"
          : "linear-gradient(160deg, #fbf1d6 0%, #f3e9d2 60%, #e6d6ac 100%)",
        color: night ? "#fbf1d6" : "#16261e",
        border: night ? "1px solid rgba(232,189,79,.6)" : "2px solid #c9a24a",
        borderRadius: 16,
        padding: wide ? 10 : 16,
        boxShadow: night
          ? "0 18px 50px rgba(0,0,0,.5)"
          : "0 18px 50px rgba(0,0,0,.5), inset 0 0 0 4px rgba(251,241,214,.65), inset 0 0 0 5px rgba(122,95,28,.4)",
        overflow: "hidden"
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 8,
          background: night
            ? "linear-gradient(90deg, #35d07f, #e8bd4f)"
            : "linear-gradient(90deg, #35d07f, #38bdf8, #ff5a5f, #ff9650, #a78bfa)"
        }}
      />
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 6, border: night ? "1px solid rgba(201,162,74,.2)" : "1px solid rgba(122,95,28,.35)", borderRadius: 11, pointerEvents: "none" }}
      />
      {title || subtitle ? (
        <header style={{ paddingTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <img
              src={`${import.meta.env.BASE_URL}ldc-logo.jpg`}
              alt={`${LDC_CLUB.name} logo`}
              width={38}
              height={38}
              style={{ borderRadius: "50%", objectFit: "cover", border: "1px solid #c9a24a", background: "#fff" }}
            />
            <div style={{ display: "grid", lineHeight: 1.25, minWidth: 0 }}>
              <strong style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: night ? "#e8bd4f" : "#7a5f1c" }}>
                LDC — ESTIN · Welcome Day
              </strong>
              <a
                href={LDC_CLUB.instagramUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: night ? "#35d07f" : "#1f8a62", fontWeight: 700, textDecoration: "none" }}
              >
                {LDC_CLUB.instagramLabel}
              </a>
            </div>
          </div>
          {title ? (
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.5rem, 6vw, 2.1rem)",
                fontFamily: "'Barlow Condensed','Arial Narrow',Impact,sans-serif",
                fontStyle: "italic",
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                lineHeight: 1,
                color: night ? "#fbf1d6" : undefined
              }}
            >
              {title}
            </h1>
          ) : null}
          {subtitle ? <p style={{ margin: "6px 0 0", color: night ? "#c9d3bd" : "#4a5a4a" }}>{subtitle}</p> : null}
        </header>
      ) : null}
      <section style={{ minWidth: 0, overflowWrap: "anywhere" }}>{children}</section>
      {footer ? <footer style={{ minWidth: 0 }}>{footer}</footer> : null}
      <footer style={{ textAlign: "center", color: night ? "#c9d3bd" : "#7a6f4d", fontSize: 11, lineHeight: 1.5 }}>
        {LDC_CLUB.footerCredit} ·{" "}
        <a href={LDC_CLUB.instagramUrl} target="_blank" rel="noreferrer" style={{ color: night ? "#35d07f" : "#1f8a62", fontWeight: 700 }}>
          {LDC_CLUB.instagramLabel}
        </a>
      </footer>
    </main>
  );
}
