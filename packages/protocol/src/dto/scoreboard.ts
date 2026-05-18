export interface ScoreEntryDto {
  playerId: string;
  delta: number;
  total: number;
  reason?: string;
}

export interface ScoreboardSnapshot {
  roomCode: string;
  entries: ScoreEntryDto[];
  updatedAt: number;
}
