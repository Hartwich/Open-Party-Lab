/**
 * Soft, warm shadows. The tint is brown rather than blue-black so panels feel
 * like paper on a table instead of glass on a dark screen.
 */
export const elevation = {
  /** Barely-there lift for list rows and inline chips. */
  hairline: "0 1px 2px rgba(60, 43, 26, 0.06)",
  /** Default card shadow. */
  card: "0 8px 28px rgba(60, 43, 26, 0.07)",
  /** Panels floating over game art. */
  panel: "0 14px 40px rgba(60, 43, 26, 0.14)",
  /** Bottom dock / floating controls. */
  dock: "0 12px 32px rgba(60, 43, 26, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
  /** Dock button while its menu is open. */
  dockActive:
    "0 16px 36px rgba(189, 71, 39, 0.26), 0 0 0 4px rgba(209, 95, 59, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
  /** Modal dialogs and full-screen overlays. */
  modal: "0 24px 70px rgba(60, 43, 26, 0.24)",
  /** Legacy alias kept so older call sites keep compiling. */
  paper: "0 8px 28px rgba(60, 43, 26, 0.07)"
} as const;
