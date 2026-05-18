import type { ArenaSurvivorCharacterState, PlayerSnapshot, RoomSnapshot } from "@open-party-lab/protocol";
import { ControllerFrame } from "../controller-ui/layout/ControllerFrame.js";
import { getControllerText } from "../i18n/controllerText.js";

interface LobbyPageProps {
  room: RoomSnapshot | null;
  player: PlayerSnapshot | null;
  error: string | null;
  onLeaveRoom: () => void;
  onSetReady: (isReady: boolean) => void;
  onSelectCharacter: (characterId: string) => void;
}

function renderArenaSurvivorCharacterChooser(
  room: RoomSnapshot,
  currentPlayer: PlayerSnapshot | null,
  text: ReturnType<typeof getControllerText>,
  onSelectCharacter: (characterId: string) => void
) {
  const characterOptions = room.arenaSurvivorCharacterOptions ?? [];

  if (characterOptions.length === 0) {
    return null;
  }

  const playersByCharacterId = new Map<string, PlayerSnapshot[]>();

  for (const player of room.players) {
    if (!player.selectedCharacterId) {
      continue;
    }

    const players = playersByCharacterId.get(player.selectedCharacterId) ?? [];
    players.push(player);
    playersByCharacterId.set(player.selectedCharacterId, players);
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "grid",
          gap: 6,
          padding: "12px 14px",
          borderRadius: "var(--radius-md)",
          background: "rgba(8, 47, 73, 0.4)",
          color: "var(--text-muted)"
        }}
      >
        <strong style={{ color: "var(--text-main)" }}>{text.characterChooseTitle}</strong>
        <span>{text.characterChooseDescription}</span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {characterOptions.map((character) => {
          const selectedByCurrentPlayer = currentPlayer?.selectedCharacterId === character.id;
          const selectedPlayers = playersByCharacterId.get(character.id) ?? [];

          return (
            <button
              key={character.id}
              type="button"
              onClick={() => onSelectCharacter(character.id)}
              style={{
                border: selectedByCurrentPlayer
                  ? `2px solid ${character.visual.accentColor}`
                  : "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: "var(--radius-md)",
                background: selectedByCurrentPlayer
                  ? "linear-gradient(180deg, rgba(8, 47, 73, 0.84) 0%, rgba(15, 23, 42, 0.92) 100%)"
                  : "rgba(15, 23, 42, 0.68)",
                padding: "14px 16px",
                color: "var(--text-main)",
                textAlign: "left"
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: character.portraitPath ? "72px 1fr" : "1fr",
                  gap: 12,
                  alignItems: "start"
                }}
              >
                {character.portraitPath ? (
                  <img
                    src={character.portraitPath}
                    alt=""
                    width={72}
                    height={72}
                    style={{
                      borderRadius: 16,
                      objectFit: "cover",
                      border: "1px solid rgba(148, 163, 184, 0.18)",
                      background: "rgba(15, 23, 42, 0.7)"
                    }}
                  />
                ) : null}
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ display: "grid", gap: 2 }}>
                      <strong>{character.name}</strong>
                      <span style={{ color: character.visual.secondaryColor, fontSize: "0.9rem" }}>{character.title}</span>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "var(--text-muted)",
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em"
                      }}
                    >
                      {character.archetype}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.45 }}>{character.description}</p>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <span style={{ color: selectedByCurrentPlayer ? "var(--success)" : "var(--text-muted)" }}>
                      {selectedByCurrentPlayer ? text.yourCharacter : text.select}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {selectedPlayers.length > 0
                        ? text.chosenBy(selectedPlayers.map((entry) => entry.name).join(", "))
                        : text.stillFree}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function LobbyPage({
  room,
  player,
  error,
  onLeaveRoom,
  onSetReady,
  onSelectCharacter
}: LobbyPageProps) {
  const text = getControllerText(room?.language);
  const currentPlayer = room?.players.find((entry) => entry.id === player?.id) ?? player;
  const selectedGame =
    room?.availableGames.find((game) => game.id === room.selectedGameId);
  const selectedGameName = selectedGame?.displayName ?? "Noch kein Spiel";
  const playerCount = room?.players.length ?? 0;
  const readyCount = (room?.players ?? []).filter((entry) => entry.isReady).length;
  const enoughPlayers = selectedGame ? playerCount >= selectedGame.minPlayers : false;
  const arenaSurvivorSelected = room?.selectedGameId === "arena-survivor";
  const characterSelectionMissing = arenaSurvivorSelected && !currentPlayer?.selectedCharacterId;

  return (
    <ControllerFrame
      title={`Lobby ${room?.code ?? "----"}`}
      subtitle={room?.selectedGameId ? text.lobbySelected(selectedGameName) : text.lobbyWaitingHost}
      footer={error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <button type="button" onClick={onLeaveRoom} style={secondaryButtonStyle}>
          {text.leaveRoom}
        </button>

        <button
          type="button"
          onClick={() => onSetReady(!(currentPlayer?.isReady ?? false))}
          disabled={characterSelectionMissing}
          style={{
            border: 0,
            borderRadius: "var(--radius-md)",
            background: currentPlayer?.isReady ? "var(--success)" : "var(--accent)",
            color: "#052e16",
            padding: "16px 20px",
            fontWeight: 800,
            opacity: characterSelectionMissing ? 0.55 : 1
          }}
        >
          {characterSelectionMissing
            ? text.chooseCharacterFirst
            : currentPlayer?.isReady
              ? text.notReady
              : text.ready}
        </button>

        {selectedGame ? (
          <div
            style={{
              display: "grid",
              gap: 6,
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              background: "rgba(15, 23, 42, 0.55)",
              color: "var(--text-muted)"
            }}
          >
            <strong style={{ color: "var(--text-main)" }}>{selectedGame.displayName}</strong>
            <span>
              {text.players}: {playerCount}/{selectedGame.maxPlayers} | {text.minRequired(selectedGame.minPlayers)}
            </span>
            <span>
              {text.readyCount}: {readyCount}/{playerCount}
              {enoughPlayers ? "" : ` | ${text.needsMorePlayers}`}
            </span>
            {arenaSurvivorSelected ? (
              <span>
                {text.character}: {currentPlayer?.selectedCharacterName ?? text.noCharacter}
              </span>
            ) : null}
          </div>
        ) : null}

        {room && arenaSurvivorSelected
          ? renderArenaSurvivorCharacterChooser(room, currentPlayer, text, onSelectCharacter)
          : null}

        <div style={{ display: "grid", gap: 10 }}>
          {(room?.players ?? []).map((entry) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: "rgba(15, 23, 42, 0.55)"
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <strong>{entry.name}</strong>
                {arenaSurvivorSelected ? (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.86rem" }}>
                    {entry.selectedCharacterName ?? text.noCharacter}
                  </span>
                ) : null}
              </div>
              <span style={{ color: entry.connected ? "var(--success)" : "var(--text-muted)" }}>
                {entry.connected ? (entry.isReady ? text.connectedReady : text.connectedWaiting) : entry.presence}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ControllerFrame>
  );
}

const secondaryButtonStyle = {
  border: "1px solid rgba(248, 113, 113, 0.45)",
  borderRadius: "var(--radius-md)",
  background: "rgba(127, 29, 29, 0.18)",
  color: "var(--text-main)",
  padding: "14px 18px",
  fontWeight: 700
} as const;
