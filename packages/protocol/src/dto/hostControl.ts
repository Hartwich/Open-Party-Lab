/**
 * Remote host control.
 *
 * The shared screen owns the room by default, and any player may take over the
 * host controls — game selection, round start, roster, language, settings.
 *
 * Taking over is not a request anyone has to grant. While the screen still holds
 * the controls, asking simply takes them: the screen is furniture, nobody is
 * waiting behind it to press a button, and a prompt nobody answers is a dead
 * end. A request only becomes a question when it would take the controls *away
 * from another player*, and that question answers itself after
 * `hostControlHandoverMs` — the person holding the phone may have put it down,
 * and the room should not be stuck because of it.
 *
 * The holder is identified by player id rather than socket id so the permission
 * survives a phone reconnect.
 */

/** How long the current holder has to answer before the handover goes through. */
export const hostControlHandoverMs = 30_000;

export interface HostControlRequestSnapshot {
  playerId: string;
  playerName: string;
  requestedAt: number;
  /** Wall-clock deadline; the handover happens by itself once it passes. */
  expiresAt: number;
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

/** True when this player is waiting for the current holder to answer. */
export function hasPendingHostControlRequest(
  hostControl: HostControlSnapshot | null | undefined,
  playerId: string | null | undefined
): boolean {
  return Boolean(playerId && hostControl?.pendingRequest?.playerId === playerId);
}

/**
 * True when this player is the one being asked to hand the controls over.
 *
 * The prompt belongs to whoever currently holds them, not to the shared screen:
 * the screen is not losing anything.
 */
export function isAskedToHandOverHostControl(
  hostControl: HostControlSnapshot | null | undefined,
  playerId: string | null | undefined
): boolean {
  return Boolean(
    playerId && hostControl?.pendingRequest && hostControl.holderPlayerId === playerId
  );
}

/** Milliseconds left on a pending request, floored at zero. */
export function hostControlRequestRemainingMs(
  hostControl: HostControlSnapshot | null | undefined,
  now: number
): number {
  const expiresAt = hostControl?.pendingRequest?.expiresAt;
  return expiresAt === undefined ? 0 : Math.max(0, expiresAt - now);
}

/** Reason a takeover request was rejected, for user-facing copy. */
export type HostControlDenyReason = "declined" | "already-held" | "round-active";
