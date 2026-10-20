import type { ControllerAppState } from "../../app/controllerSocketClient.js";
import { getAvatarById } from "../common/HunterAvatars.js";

interface StandingsPanelProps {
  state: ControllerAppState;
  label: string;
}

/**
 * Compact live standings for the phone.
 *
 * Identity (name + Hunter avatar) comes from the scoreboard entries, which the
 * server now enriches from the roster; if a game has not reported scores yet we
 * fall back to the room's player list so the faces still show.
 */
export function StandingsPanel({ state, label }: StandingsPanelProps) {
  const scoreboard = state.scoreboard;
  const roomPlayers = state.room?.players ?? [];
  const currentPlayerId = state.player?.id ?? null;

  const rows = scoreboard
    ? scoreboard.entries.map((entry) => {
        const roster = roomPlayers.find((player) => player.id === entry.playerId);
        return {
          id: entry.playerId,
          name: entry.name ?? roster?.name ?? "—",
          color: entry.color ?? roster?.color ?? "#888888",
          avatarId: entry.avatarId ?? roster?.avatarId ?? null,
          total: entry.total,
          delta: entry.delta
        };
      })
    : roomPlayers.map((player) => ({
        id: player.id,
        name: player.name,
        color: player.color,
        avatarId: player.avatarId,
        total: player.score,
        delta: 0
      }));

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="hxh-standings">
      <p className="hxh-standings-label">{label}</p>
      <div className="hxh-standings-list">
        {rows.map((row) => {
          const avatar = row.avatarId ? getAvatarById(row.avatarId) : null;
          const isMe = row.id === currentPlayerId;
          return (
            <div key={row.id} className={`hxh-standings-row${isMe ? " is-me" : ""}`}>
              <span className="hxh-standings-avatar" style={{ ["--hunter-accent" as string]: avatar?.color ?? row.color }}>
                {avatar ? avatar.renderSvg(26) : null}
              </span>
              <span className="hxh-standings-name">{row.name}</span>
              <span className="hxh-standings-score">{row.total}</span>
              {row.delta !== 0 ? (
                <span className={`hxh-standings-delta${row.delta > 0 ? " is-up" : " is-down"}`}>
                  {row.delta > 0 ? "+" : ""}{row.delta}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
