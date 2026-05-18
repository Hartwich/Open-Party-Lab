export function buildJoinUrl(origin: string, roomCode: string): string {
  const normalizedOrigin = origin.replace(/\/$/, "");
  return `${normalizedOrigin}/#join?room=${roomCode}`;
}
