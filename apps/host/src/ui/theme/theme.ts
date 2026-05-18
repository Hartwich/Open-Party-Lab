import { colors, typography } from "@open-party-lab/ui-kit";

export const hostTheme = {
  background: "#020617",
  panel: "#0f172a",
  accent: colors.sky,
  success: colors.mint,
  warning: colors.sun,
  danger: colors.coral,
  text: colors.paper,
  muted: "#94a3b8",
  titleFont: typography.display,
  bodyFont: typography.body,
  monoFont: typography.mono
} as const;
