export type ConnectionRole = "host" | "controller";
export type PlayerPresence = "online" | "reconnecting" | "offline";

export interface PlayerSnapshot {
  id: string;
  name: string;
  color: string;
  selectedCharacterId: string | null;
  selectedCharacterName: string | null;
  isReady: boolean;
  connected: boolean;
  presence: PlayerPresence;
  score: number;
  joinedAt: number;
  lastSeenAt: number;
  reconnectGraceEndsAt: number | null;
}
