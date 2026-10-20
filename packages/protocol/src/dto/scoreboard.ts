export interface ScoreEntryDto {
  playerId: string;
  delta: number;
  total: number;
  reason?: string;
  /** Display name of the player, when known. Mirrors the roster identity. */
  name?: string;
  /** Player accent color, when known. */
  color?: string;
  /** Chosen Hunter avatar id, when the player picked one. */
  avatarId?: string | null;
}

export interface ScoreboardSnapshot {
  roomCode: string;
  entries: ScoreEntryDto[];
  updatedAt: number;
}
