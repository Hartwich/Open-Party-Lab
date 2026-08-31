/**
 * Remote host control.
 *
 * The shared screen owns the room by default. Any player may ask to take over
 * the host controls (game selection, round start, roster, language); the shared
 * screen approves or denies the request, and control can be handed back at any
 * time by either side.
 *
 * The holder is identified by player id rather than socket id so the permission
 * survives a phone reconnect.
 */
export interface HostControlRequestSnapshot {
  playerId: string;
  playerName: string;
  requestedAt: number;
}

export interface HostControlSnapshot {
  /** Player currently holding the controls, or null while the screen owns them. */
  holderPlayerId: string | null;
  holderName: string | null;
  /** At most one request is pending at a time; further requests replace it. */
  pendingRequest: HostControlRequestSnapshot | null;
}

export const emptyHostControl: HostControlSnapshot = {
  holderPlayerId: null,
  holderName: null,
  pendingRequest: null
};

/** True when this player may drive the room right now. */
export function hasHostControl(
  hostControl: HostControlSnapshot | null | undefined,
  playerId: string | null | undefined
): boolean {
  return Boolean(playerId && hostControl?.holderPlayerId === playerId);
}

/** True when this player is waiting for the screen to answer. */
export function hasPendingHostControlRequest(
  hostControl: HostControlSnapshot | null | undefined,
  playerId: string | null | undefined
): boolean {
  return Boolean(playerId && hostControl?.pendingRequest?.playerId === playerId);
}

/** Reason a takeover request was rejected, for user-facing copy. */
export type HostControlDenyReason = "declined" | "already-held" | "round-active";
