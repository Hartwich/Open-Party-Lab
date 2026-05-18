import type { BaseRoundState } from "@open-party-lab/game-core";

export interface AirHockeyPaddleState {
  playerId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  inputX: number;
  inputY: number;
}

export interface AirHockeyInput {
  type: "move";
  playerId: string;
  moveX: number;
  moveY: number;
  sentAt: number;
}

export interface AirHockeyState extends BaseRoundState {
  arenaWidth: number;
  arenaHeight: number;
  puckX: number;
  puckY: number;
  puckVx: number;
  puckVy: number;
  paddleRadius: number;
  puckRadius: number;
  goalSize: number;
  targetScore: number;
  tick: number;
  leftPlayerId: string;
  rightPlayerId: string;
  serveDirection: "left" | "right";
  serveCountdownEndsAt: number | null;
  paddles: Record<string, AirHockeyPaddleState>;
  scoresByPlayer: Record<string, number>;
  winnerPlayerId?: string;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
