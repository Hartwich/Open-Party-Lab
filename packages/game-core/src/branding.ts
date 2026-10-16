/**
 * Shared LDC Club branding for the host screen, landing page and controllers.
 *
 * Keep user-facing branding in one place so the shell, landing page and
 * phone UI stay consistent. The logo file is vendored at
 * `apps/host/public/ldc-logo.jpg` and `apps/controller/public/ldc-logo.jpg`
 * (sourced from the club Instagram profile) so the app does not depend on an
 * expiring Instagram CDN URL at runtime.
 */
export const LDC_CLUB = {
  name: "LDC Club",
  shortName: "LDC",
  tagline: "LDC Club Party",
  instagramUrl: "https://www.instagram.com/ldc.club/",
  instagramLabel: "@ldc.club",
  logoPath: "ldc-logo.jpg",
  footerCredit: "Made by LDC — best member Israa Chiheb",
} as const;
