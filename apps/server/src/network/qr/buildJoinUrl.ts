import type { SupportedLanguage } from "@open-party-lab/protocol";

export function buildJoinUrl(origin: string, roomCode: string, language: SupportedLanguage): string {
  const normalizedOrigin = origin.replace(/\/$/, "");
  const params = new URLSearchParams({ room: roomCode, lang: language });
  return `${normalizedOrigin}/#join?${params}`;
}
