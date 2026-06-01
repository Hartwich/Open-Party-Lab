import type {
  AvailableGameDto,
  RoomLifecycle,
  RoomSnapshot
} from "@open-party-lab/protocol";
import type { RoomRecord } from "./roomStore.js";

export function deriveRoomLifecycle(room: RoomRecord): RoomLifecycle {
  if (room.currentRound) {
    return room.currentRound.phase;
  }

  if (room.selectedGameId) {
    return "game_selected";
  }

  return "lobby";
}

function isArenaSurvivorContinuingRun(room: RoomRecord): boolean {
  if (room.selectedGameId !== "arena-survivor" || !room.currentRound) {
    return false;
  }

  const roundState = room.currentRound.state as {
    result?: { outcome?: string };
  };

  return room.currentRound.phase === "finished" && roundState.result?.outcome === "survived";
}

function areRequiredPlayerSetupChoicesSelected(room: RoomRecord, selectedGame: AvailableGameDto): boolean {
  if (selectedGame.playerSetup?.required !== true) {
    return true;
  }

  const validOptionIds = new Set(selectedGame.playerSetup.options.map((option) => option.id));

  return [...room.players.values()].every(
    (player) => Boolean(player.selectedCharacterId) && validOptionIds.has(player.selectedCharacterId ?? "")
  );
}

function isLobbySetupConfirmed(room: RoomRecord, selectedGame: AvailableGameDto): boolean {
  const confirmation = selectedGame.lobbySetup?.confirmation;

  if (!confirmation) {
    return true;
  }

  if (selectedGame.id === "arena-survivor" && isArenaSurvivorContinuingRun(room)) {
    return true;
  }

  const settings = room.gameSettingsByGameId[selectedGame.id] ?? {};
  return settings[confirmation.settingKey] === true;
}

function toPublicSelectedGameSettings(room: RoomRecord): Record<string, string | number | boolean> | undefined {
  if (!room.selectedGameId) {
    return undefined;
  }

  const settings = room.gameSettingsByGameId[room.selectedGameId] ?? {};
  const publicSettings = Object.fromEntries(
    Object.entries(settings).filter(
      (entry): entry is [string, string | number | boolean] =>
        typeof entry[1] === "string" || typeof entry[1] === "number" || typeof entry[1] === "boolean"
    )
  );

  return Object.keys(publicSettings).length > 0 ? publicSettings : undefined;
}

export function canStartRound(room: RoomRecord, selectedGame: AvailableGameDto | undefined): boolean {
  if (!room.selectedGameId || !selectedGame) {
    return false;
  }

  if (room.currentRound && room.currentRound.phase !== "finished") {
    return false;
  }

  const players = [...room.players.values()];
  const allPlayersReady = players.length > 0 && players.every((player) => player.isReady);
  const allRequiredPlayerSetupChoicesSelected = areRequiredPlayerSetupChoicesSelected(room, selectedGame);
  const setupConfirmed = isLobbySetupConfirmed(room, selectedGame);

  return (
    allPlayersReady &&
    allRequiredPlayerSetupChoicesSelected &&
    setupConfirmed &&
    players.length >= selectedGame.minPlayers &&
    players.length <= selectedGame.maxPlayers
  );
}

export function explainCannotStartRound(
  room: RoomRecord,
  selectedGame: AvailableGameDto | undefined
): string | null {
  const en = room.language === "en";

  if (!room.selectedGameId || !selectedGame) {
    return en ? "Please choose a game first." : "Bitte zuerst ein Spiel auswaehlen.";
  }

  if (room.currentRound && room.currentRound.phase !== "finished") {
    return en ? "The current round is still running." : "Die aktuelle Runde laeuft noch.";
  }

  const players = [...room.players.values()];

  if (players.length < selectedGame.minPlayers) {
    return en
      ? `${selectedGame.displayName} needs at least ${selectedGame.minPlayers} players.`
      : `${selectedGame.displayName} braucht mindestens ${selectedGame.minPlayers} Spieler.`;
  }

  if (players.length > selectedGame.maxPlayers) {
    return en
      ? `${selectedGame.displayName} allows at most ${selectedGame.maxPlayers} players.`
      : `${selectedGame.displayName} erlaubt hoechstens ${selectedGame.maxPlayers} Spieler.`;
  }

  const waitingPlayers = players.filter((player) => !player.isReady);

  if (waitingPlayers.length > 0) {
    return en
      ? `Not everyone is ready yet: ${waitingPlayers.map((player) => player.name).join(", ")}.`
      : `Es sind noch nicht alle bereit: ${waitingPlayers.map((player) => player.name).join(", ")}.`;
  }

  if (!areRequiredPlayerSetupChoicesSelected(room, selectedGame)) {
    const validOptionIds = new Set(selectedGame.playerSetup?.options.map((option) => option.id) ?? []);
    const missingChoices = players
      .filter(
        (player) => !player.selectedCharacterId || !validOptionIds.has(player.selectedCharacterId)
      )
      .map((player) => player.name)
      .join(", ");

    return en
      ? `These players need to choose their setup first: ${missingChoices}.`
      : `Diese Spieler muessen erst ihre Auswahl treffen: ${missingChoices}.`;
  }

  if (!isLobbySetupConfirmed(room, selectedGame)) {
    return en
      ? "The host needs to confirm the game setup first."
      : "Der Host muss das Spiel-Setup erst bestaetigen.";
  }

  return null;
}

export function toRoomSnapshot(
  room: RoomRecord,
  availableGames: AvailableGameDto[]
): RoomSnapshot {
  const selectedGame = room.selectedGameId
    ? availableGames.find((game) => game.id === room.selectedGameId)
    : undefined;
  return {
    code: room.code,
    createdAt: room.createdAt,
    joinUrl: room.joinUrl,
    language: room.language,
    hostConnected: room.hostSocketId !== null,
    lifecycle: deriveRoomLifecycle(room),
    selectedGameId: room.selectedGameId,
    selectedGameSettings: toPublicSelectedGameSettings(room),
    availableGames,
    players: [...room.players.values()]
      .sort((left, right) => left.joinedAt - right.joinedAt)
      .map((player) => ({
        id: player.id,
        name: player.name,
        color: player.color,
        selectedCharacterId: player.selectedCharacterId,
        selectedCharacterName: player.selectedCharacterId
          ? selectedGame?.playerSetup?.options.find((option) => option.id === player.selectedCharacterId)?.name ?? null
          : null,
        isReady: player.isReady,
        connected: player.connected,
        presence: player.presence,
        score: player.score,
        joinedAt: player.joinedAt,
        lastSeenAt: player.lastSeenAt,
        reconnectGraceEndsAt: player.reconnectGraceEndsAt
      })),
    currentRound: room.currentRound
      ? {
          gameId: room.currentRound.gameId,
          roundNumber: room.currentRound.roundNumber,
          phase: room.currentRound.phase,
          startedAt: room.currentRound.startedAt,
          phaseStartedAt: room.currentRound.phaseStartedAt,
          phaseEndsAt: room.currentRound.phaseEndsAt,
          updatedAt: room.currentRound.updatedAt,
          message: room.currentRound.message
        }
      : null
  };
}
