import {
  canManagePlayerRoster,
  hasActiveRound,
  hasHostControl,
  hasPendingHostControlRequest,
  isAskedToHandOverHostControl,
  type PlayerSnapshot,
  type RoomSnapshot
} from "@open-party-lab/protocol";
import { useEffect, useState } from "react";
import { getControllerText } from "../../i18n/controllerText.js";
import { LobbySetupControls } from "./LobbySetupControls.js";

/**
 * Seconds left on a pending handover, ticking once per second.
 *
 * The deadline is a timestamp in the room snapshot, and the server completes
 * the handover on its own — this only keeps the number on screen honest while
 * the phone waits, and stops ticking as soon as there is nothing pending.
 */
function useHostControlCountdown(room: RoomSnapshot): number {
  const expiresAt = room.hostControl.pendingRequest?.expiresAt ?? null;
  const [remaining, setRemaining] = useState(() =>
    expiresAt === null ? 0 : Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    if (expiresAt === null) {
      setRemaining(0);
      return;
    }

    const update = () => setRemaining(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));

    update();
    const handle = setInterval(update, 1000);

    return () => clearInterval(handle);
  }, [expiresAt]);

  return remaining;
}

export interface HostControlPanelProps {
  room: RoomSnapshot;
  player: PlayerSnapshot | null;
  onRequestControl: () => void;
  onReleaseControl: () => void;
  /** Answers a handover aimed at this player. */
  onResolveControl: (playerId: string, grant: boolean) => void;
  onSelectGame: (gameId: string) => void;
  onHostAction: (gameId: string, action: unknown) => void;
  onStartRound: () => void;
  onBackToMenu: () => void;
  onKickPlayer: (playerId: string) => void;
}

const panelStyle = {
  marginTop: 14,
  padding: 14,
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-lg)",
  background: "var(--surface)",
  boxShadow: "var(--shadow-card)",
  display: "grid",
  gap: 10
} as const;

const headingStyle = {
  margin: 0,
  fontFamily: "var(--font-display)",
  fontWeight: 500,
  fontSize: "1.15rem"
} as const;

const noteStyle = {
  margin: 0,
  color: "var(--muted)",
  fontSize: ".85rem",
  lineHeight: 1.45
} as const;

const actionStyle = {
  minHeight: 48,
  padding: "0 16px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent)",
  background: "var(--accent)",
  color: "var(--on-accent)",
  fontWeight: 700,
  width: "100%"
} as const;

const secondaryActionStyle = {
  ...actionStyle,
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--ink)"
} as const;

/**
 * Phone-side host controls.
 *
 * Renders one of three states: an invitation to take over, a pending request,
 * or the full control surface. Every action here is also gated server-side —
 * this component only decides what is worth showing.
 */
export function HostControlPanel({
  room,
  player,
  onRequestControl,
  onReleaseControl,
  onResolveControl,
  onSelectGame,
  onHostAction,
  onStartRound,
  onBackToMenu,
  onKickPlayer
}: HostControlPanelProps) {
  const text = getControllerText(room.language);
  const playerId = player?.id ?? null;
  const inControl = hasHostControl(room.hostControl, playerId);
  const requestPending = hasPendingHostControlRequest(room.hostControl, playerId);
  const otherHolder =
    room.hostControl.holderPlayerId && !inControl ? room.hostControl.holderName : null;
  const handoverRequest = isAskedToHandOverHostControl(room.hostControl, playerId)
    ? room.hostControl.pendingRequest
    : null;
  const remainingSeconds = useHostControlCountdown(room);

  if (!inControl) {
    return (
      <section style={panelStyle}>
        <h2 style={headingStyle}>{text.hostControlTitle}</h2>
        {requestPending ? (
          <>
            <p style={noteStyle}>{text.hostControlPending}</p>
            <p style={noteStyle}>{text.hostControlPendingCountdown(remainingSeconds)}</p>
          </>
        ) : (
          <>
            {otherHolder ? (
              <p style={noteStyle}>{text.hostControlHeldByOther(otherHolder)}</p>
            ) : null}
            {/* Free controls need no permission, so the same button both asks
                and takes — which of the two it was is visible a moment later. */}
            <button type="button" style={secondaryActionStyle} onClick={onRequestControl}>
              {text.hostControlTake}
            </button>
          </>
        )}
      </section>
    );
  }

  const roundRunning = hasActiveRound(room);
  const canManageRoster = canManagePlayerRoster(room);
  const selectedGame = room.availableGames.find((game) => game.id === room.selectedGameId);

  return (
    <section style={panelStyle}>
      <h2 style={headingStyle}>{text.hostControlTitle}</h2>
      <p style={noteStyle}>{text.hostControlActive}</p>

      {/* The handover prompt belongs here, to the player who would lose the
          controls. Ignoring it is an answer too: the deadline grants them. */}
      {handoverRequest ? (
        <div
          style={{
            display: "grid",
            gap: 8,
            padding: 12,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--accent)",
            background: "var(--accent-soft)"
          }}
        >
          <strong>{text.hostControlHandoverTitle}</strong>
          <span style={noteStyle}>
            {text.hostControlHandoverBody(handoverRequest.playerName)}
          </span>
          <span style={noteStyle}>
            {text.hostControlHandoverCountdown(remainingSeconds)}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={{ ...secondaryActionStyle, flex: 1 }}
              onClick={() => onResolveControl(handoverRequest.playerId, false)}
            >
              {text.hostControlHandoverKeep}
            </button>
            <button
              type="button"
              style={{ ...actionStyle, flex: 1 }}
              onClick={() => onResolveControl(handoverRequest.playerId, true)}
            >
              {text.hostControlHandoverGive}
            </button>
          </div>
        </div>
      ) : null}

      {roundRunning ? (
        <button type="button" style={secondaryActionStyle} onClick={onBackToMenu}>
          {text.hostControlBackToMenu}
        </button>
      ) : (
        <>
          <p style={{ ...noteStyle, marginTop: 4 }}>{text.hostControlChooseGame}</p>
          <div style={{ display: "grid", gap: 6 }}>
            {room.availableGames.map((game) => {
              const selected = room.selectedGameId === game.id;

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => onSelectGame(game.id)}
                  style={{
                    minHeight: 46,
                    padding: "0 14px",
                    borderRadius: "var(--radius-md)",
                    border: selected ? "2px solid var(--accent)" : "1px solid var(--line)",
                    background: selected ? "var(--accent-soft)" : "var(--surface-muted)",
                    color: "var(--ink)",
                    fontWeight: selected ? 700 : 400,
                    textAlign: "left"
                  }}
                >
                  {game.displayName}
                </button>
              );
            })}
          </div>

          {selectedGame ? (
            <>
              {/* The game's own settings — map, ruleset, starting values — so
                  holding control does not mean walking back to the screen. */}
              <LobbySetupControls
                game={selectedGame}
                settings={room.selectedGameSettings ?? {}}
                disabled={roundRunning}
                onHostAction={onHostAction}
              />
              <button type="button" style={actionStyle} onClick={onStartRound}>
                {text.hostControlStartRound}
              </button>
              <button type="button" style={secondaryActionStyle} onClick={onBackToMenu}>
                {text.hostControlBackToMenu}
              </button>
            </>
          ) : null}
        </>
      )}

      <p style={{ ...noteStyle, marginTop: 4 }}>{text.hostControlRoster}</p>
      {canManageRoster ? null : <p style={noteStyle}>{text.hostControlRoundRunning}</p>}
      <div style={{ display: "grid", gap: 6 }}>
        {room.players.map((entry) => (
          <div
            key={entry.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minHeight: 44,
              padding: "0 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line)",
              background: "var(--surface-muted)"
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: entry.color,
                flex: "0 0 auto"
              }}
            />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              {entry.name}
            </span>
            {canManageRoster && entry.id !== playerId ? (
              <button
                type="button"
                aria-label={text.hostControlKick(entry.name)}
                onClick={() => onKickPlayer(entry.id)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--danger)",
                  background: "var(--danger-soft)",
                  color: "var(--danger)",
                  fontSize: "1.1rem",
                  lineHeight: 1
                }}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <button type="button" style={secondaryActionStyle} onClick={onReleaseControl}>
        {text.hostControlRelease}
      </button>
    </section>
  );
}
