import type { PlayerSetupValue, PlayerSnapshot, RoomSnapshot } from "@open-party-lab/protocol";
import { ControllerFrame } from "../controller-ui/layout/ControllerFrame.js";
import { getControllerText } from "../i18n/controllerText.js";

type AvailableRoomGame = RoomSnapshot["availableGames"][number];
type PlayerSetup = NonNullable<AvailableRoomGame["playerSetup"]>;
type PlayerSetupOption = PlayerSetup["options"][number];

interface LobbyPageProps {
  room: RoomSnapshot | null;
  player: PlayerSnapshot | null;
  error: string | null;
  onLeaveRoom: () => void;
  onSetReady: (isReady: boolean) => void;
  onSetPlayerSetup: (selectionKey: string, value: PlayerSetupValue) => void;
}

function getPlayerSetupVisual(option: PlayerSetupOption): NonNullable<PlayerSetupOption["visual"]> {
  return option.visual ?? {
    primaryColor: "#38bdf8",
    secondaryColor: "#bae6fd",
    accentColor: "#facc15"
  };
}

function getPlayerSetupSelectionKey(setup: PlayerSetup): string {
  return setup.selectionKey ?? "character";
}

function getPlayerSetupValue(player: PlayerSnapshot | null, setup: PlayerSetup): PlayerSetupValue | undefined {
  const selectionKey = getPlayerSetupSelectionKey(setup);
  const storedValue = player?.setupSelections?.[selectionKey];

  if (storedValue !== undefined) {
    return storedValue;
  }

  if (setup.kind === "choice" && selectionKey === "character") {
    return player?.selectedCharacterId ?? undefined;
  }

  if (setup.kind === "multi-select" && setup.defaultValue) {
    return [...setup.defaultValue];
  }

  return undefined;
}

function isPlayerSetupSelectionMissing(player: PlayerSnapshot | null, selectedGame: AvailableRoomGame | undefined): boolean {
  const setup = selectedGame?.playerSetup;

  if (!setup || setup.required !== true) {
    return false;
  }

  const validOptionIds = new Set(setup.options.map((option) => option.id));
  const value = getPlayerSetupValue(player, setup);

  if (setup.kind === "choice") {
    return typeof value !== "string" || !validOptionIds.has(value);
  }

  if (!Array.isArray(value)) {
    return true;
  }

  const uniqueValidValues = [...new Set(value)].filter((entry) => validOptionIds.has(entry));
  return uniqueValidValues.length < setup.minSelections || uniqueValidValues.length > setup.maxSelections;
}

function renderPlayerSetupIcon(option: PlayerSetupOption | undefined, index: number, size = 27) {
  if (!option) {
    return (
      <span style={{ color: "rgba(148, 163, 184, 0.32)", fontWeight: 900 }}>
        {index + 1}
      </span>
    );
  }

  const visual = getPlayerSetupVisual(option);

  if (option.iconPath) {
    return (
      <span
        style={{
          width: size,
          height: size,
          backgroundColor: visual.accentColor,
          WebkitMask: `url(${option.iconPath}) center / contain no-repeat`,
          mask: `url(${option.iconPath}) center / contain no-repeat`,
          filter: "drop-shadow(0 1px 5px rgba(2, 6, 23, 0.85))"
        }}
      />
    );
  }

  if (option.portraitPath) {
    return (
      <img
        src={option.portraitPath}
        alt=""
        width={size}
        height={size}
        style={{
          borderRadius: 8,
          objectFit: "cover",
          border: "1px solid rgba(148, 163, 184, 0.2)"
        }}
      />
    );
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        display: "grid",
        placeItems: "center",
        background: visual.primaryColor,
        color: "#020617",
        fontWeight: 900
      }}
    >
      {option.name.slice(0, 1)}
    </span>
  );
}

function renderChoicePlayerSetupChooser(
  room: RoomSnapshot,
  selectedGame: AvailableRoomGame,
  currentPlayer: PlayerSnapshot | null,
  text: ReturnType<typeof getControllerText>,
  onSetPlayerSetup: (selectionKey: string, value: PlayerSetupValue) => void
) {
  const setup = selectedGame.playerSetup;

  if (!setup || setup.kind !== "choice" || setup.options.length === 0) {
    return null;
  }

  const selectionKey = getPlayerSetupSelectionKey(setup);
  const playersBySelectionId = new Map<string, PlayerSnapshot[]>();

  for (const player of room.players) {
    const value = getPlayerSetupValue(player, setup);

    if (typeof value !== "string") {
      continue;
    }

    const players = playersBySelectionId.get(value) ?? [];
    players.push(player);
    playersBySelectionId.set(value, players);
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
        <strong style={{ color: "var(--text-main)" }}>{setup.title ?? text.characterChooseTitle}</strong>
        <span>{setup.description ?? text.characterChooseDescription}</span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {setup.options.map((option) => {
          const currentValue = getPlayerSetupValue(currentPlayer, setup);
          const selectedByCurrentPlayer = currentValue === option.id;
          const selectedPlayers = playersBySelectionId.get(option.id) ?? [];
          const visual = getPlayerSetupVisual(option);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSetPlayerSetup(selectionKey, option.id)}
              style={{
                border: selectedByCurrentPlayer
                  ? `2px solid ${visual.accentColor}`
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
                  gridTemplateColumns: option.portraitPath || option.iconPath ? "72px 1fr" : "1fr",
                  gap: 12,
                  alignItems: "start"
                }}
              >
                {option.portraitPath || option.iconPath ? (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      display: "grid",
                      placeItems: "center",
                      border: "1px solid rgba(148, 163, 184, 0.18)",
                      background: "rgba(15, 23, 42, 0.7)"
                    }}
                  >
                    {renderPlayerSetupIcon(option, 0, option.portraitPath ? 72 : 34)}
                  </div>
                ) : null}
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ display: "grid", gap: 2 }}>
                      <strong>{option.name}</strong>
                      {option.title ? (
                        <span style={{ color: visual.secondaryColor, fontSize: "0.9rem" }}>{option.title}</span>
                      ) : null}
                    </div>
                    {option.archetype ? (
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "rgba(255, 255, 255, 0.08)",
                          color: "var(--text-muted)",
                          fontSize: "0.78rem",
                          textTransform: "uppercase"
                        }}
                      >
                        {option.archetype}
                      </span>
                    ) : null}
                  </div>
                  {option.description ? (
                    <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.45 }}>{option.description}</p>
                  ) : null}

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

function renderMultiSelectPlayerSetupChooser(
  selectedGame: AvailableRoomGame,
  currentPlayer: PlayerSnapshot | null,
  text: ReturnType<typeof getControllerText>,
  onSetPlayerSetup: (selectionKey: string, value: PlayerSetupValue) => void
) {
  const setup = selectedGame.playerSetup;

  if (!setup || setup.kind !== "multi-select" || setup.options.length === 0) {
    return null;
  }

  const selectionKey = getPlayerSetupSelectionKey(setup);
  const value = getPlayerSetupValue(currentPlayer, setup);
  const selectedIds = Array.isArray(value) ? value : [];
  const selectedSet = new Set(selectedIds);
  const optionsById = new Map(setup.options.map((option) => [option.id, option]));
  const slots = Array.from({ length: setup.maxSelections }, (_, index) => optionsById.get(selectedIds[index]));
  const canReady = selectedIds.length >= setup.minSelections && selectedIds.length <= setup.maxSelections;
  const toggleOption = (optionId: string) => {
    if (selectedSet.has(optionId)) {
      if (selectedIds.length <= setup.minSelections) {
        return;
      }

      onSetPlayerSetup(selectionKey, selectedIds.filter((entry) => entry !== optionId));
      return;
    }

    if (selectedIds.length >= setup.maxSelections) {
      return;
    }

    onSetPlayerSetup(selectionKey, [...selectedIds, optionId]);
  };

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
        <strong style={{ color: "var(--text-main)" }}>{setup.title ?? text.setupChooseTitle}</strong>
        {setup.description ? <span>{setup.description}</span> : null}
        <span>{text.selectionCount(selectedIds.length, setup.minSelections, setup.maxSelections)}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {slots.map((option, index) => {
          const visual = option ? getPlayerSetupVisual(option) : null;

          return (
            <div
              key={`${option?.id ?? "empty"}:${index}`}
              title={option?.name}
              style={{
                minHeight: 54,
                borderRadius: 12,
                border: option ? `1px solid ${visual?.accentColor ?? "#38bdf8"}88` : "1px dashed rgba(148, 163, 184, 0.28)",
                background: option ? "rgba(15, 23, 42, 0.76)" : "rgba(15, 23, 42, 0.32)",
                display: "grid",
                placeItems: "center",
                boxShadow: option ? `0 0 16px ${visual?.accentColor ?? "#38bdf8"}22` : "none"
              }}
            >
              {renderPlayerSetupIcon(option, index)}
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {setup.options.map((option) => {
          const selected = selectedSet.has(option.id);
          const visual = getPlayerSetupVisual(option);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleOption(option.id)}
              style={{
                minHeight: 64,
                borderRadius: 12,
                border: selected ? `2px solid ${visual.accentColor}` : "1px solid rgba(148, 163, 184, 0.18)",
                background: selected ? "rgba(15, 23, 42, 0.94)" : "rgba(15, 23, 42, 0.54)",
                color: "var(--text-main)",
                display: "grid",
                gap: 4,
                placeItems: "center",
                padding: "7px 5px"
              }}
            >
              {renderPlayerSetupIcon(option, 0)}
              <small style={{ color: "var(--text-muted)", fontSize: 10, lineHeight: 1.1 }}>
                {option.name}
              </small>
            </button>
          );
        })}
      </div>

      {!canReady ? (
        <small style={{ color: "var(--danger)" }}>
          {text.selectionCount(selectedIds.length, setup.minSelections, setup.maxSelections)}
        </small>
      ) : null}
    </section>
  );
}

function renderPlayerSetupSummary(
  setup: PlayerSetup,
  currentPlayer: PlayerSnapshot | null,
  text: ReturnType<typeof getControllerText>
) {
  const value = getPlayerSetupValue(currentPlayer, setup);

  if (setup.kind === "choice") {
    return `${setup.title ?? text.character}: ${currentPlayer?.selectedCharacterName ?? text.noCharacter}`;
  }

  const selectedCount = Array.isArray(value) ? value.length : 0;
  return `${setup.title ?? text.setup}: ${selectedCount}/${setup.maxSelections}`;
}

function renderPlayerSetupPlayerDetail(
  player: PlayerSnapshot,
  setup: PlayerSetup,
  text: ReturnType<typeof getControllerText>
) {
  const value = getPlayerSetupValue(player, setup);

  if (setup.kind === "choice") {
    return player.selectedCharacterName ?? text.noCharacter;
  }

  const selectedCount = Array.isArray(value) ? value.length : 0;
  return text.selectionCount(selectedCount, setup.minSelections, setup.maxSelections);
}

export function LobbyPage({
  room,
  player,
  error,
  onLeaveRoom,
  onSetReady,
  onSetPlayerSetup
}: LobbyPageProps) {
  const text = getControllerText(room?.language);
  const currentPlayer = room?.players.find((entry) => entry.id === player?.id) ?? player;
  const selectedGame =
    room?.availableGames.find((game) => game.id === room.selectedGameId);
  const selectedGameName = selectedGame?.displayName ?? "Noch kein Spiel";
  const playerCount = room?.players.length ?? 0;
  const readyCount = (room?.players ?? []).filter((entry) => entry.isReady).length;
  const enoughPlayers = selectedGame ? playerCount >= selectedGame.minPlayers : false;
  const playerSetup = selectedGame?.playerSetup;
  const hasPlayerSetup = Boolean(playerSetup && playerSetup.options.length > 0);
  const playerSetupSelectionMissing = isPlayerSetupSelectionMissing(currentPlayer, selectedGame);
  const setupBlockedLabel = playerSetup?.kind === "multi-select"
    ? playerSetup.readyBlockedLabel ?? text.chooseSetupFirst
    : text.chooseCharacterFirst;

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
          disabled={playerSetupSelectionMissing}
          style={{
            border: 0,
            borderRadius: "var(--radius-md)",
            background: currentPlayer?.isReady ? "var(--success)" : "var(--accent)",
            color: "#052e16",
            padding: "16px 20px",
            fontWeight: 800,
            opacity: playerSetupSelectionMissing ? 0.55 : 1
          }}
        >
          {playerSetupSelectionMissing
            ? setupBlockedLabel
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
            {playerSetup ? (
              <span>
                {renderPlayerSetupSummary(playerSetup, currentPlayer, text)}
              </span>
            ) : null}
          </div>
        ) : null}

        {room && selectedGame && playerSetup?.kind === "choice"
          ? renderChoicePlayerSetupChooser(room, selectedGame, currentPlayer, text, onSetPlayerSetup)
          : null}

        {selectedGame && playerSetup?.kind === "multi-select"
          ? renderMultiSelectPlayerSetupChooser(selectedGame, currentPlayer, text, onSetPlayerSetup)
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
                {hasPlayerSetup && playerSetup ? (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.86rem" }}>
                    {renderPlayerSetupPlayerDetail(entry, playerSetup, text)}
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
