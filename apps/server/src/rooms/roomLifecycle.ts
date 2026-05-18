import {
  arenaSurvivorSetupConfig,
  minionsTdSetupConfig,
  type AvailableGameDto,
  type RoomLifecycle,
  type RoomSnapshot
} from "@open-party-lab/protocol";
import { arenaSurvivorCharacterDefinitions } from "../games/arena-survivor/server/definitions/characterDefinitions.js";
import { arenaSurvivorRoomSettingKeys } from "../games/arena-survivor/server/arenaSurvivorConfig.js";
import {
  minionsTdRoomSettingKeys,
  listMinionsTdMaps,
  resolveMinionsTdMap
} from "../games/minions-td/server/minionsTdConfig.js";
import { getZeichnenUndErratenLobbyState } from "../games/zeichnen-und-erraten/server/zeichnenUndErratenConfig.js";
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

function clampArenaSurvivorDifficultyTier(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return arenaSurvivorSetupConfig.difficulty.defaultValue;
  }

  return Math.max(
    arenaSurvivorSetupConfig.difficulty.min,
    Math.min(arenaSurvivorSetupConfig.difficulty.max, Math.round(value))
  );
}

function resolveArenaSurvivorSetupConfirmed(room: RoomRecord): boolean {
  const arenaSettings = room.gameSettingsByGameId["arena-survivor"] ?? {};
  return arenaSettings[arenaSurvivorRoomSettingKeys.setupConfirmed] === true;
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

export function canStartRound(room: RoomRecord, selectedGame: AvailableGameDto | undefined): boolean {
  if (!room.selectedGameId || !selectedGame) {
    return false;
  }

  if (room.currentRound && room.currentRound.phase !== "finished") {
    return false;
  }

  const players = [...room.players.values()];
  const allPlayersReady = players.length > 0 && players.every((player) => player.isReady);
  const allArenaCharactersSelected =
    selectedGame.id !== "arena-survivor" ||
    players.every((player) => Boolean(player.selectedCharacterId));
  const arenaSetupReady =
    selectedGame.id !== "arena-survivor" ||
    isArenaSurvivorContinuingRun(room) ||
    resolveArenaSurvivorSetupConfirmed(room);

  return (
    allPlayersReady &&
    allArenaCharactersSelected &&
    arenaSetupReady &&
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

  if (
    selectedGame.id === "arena-survivor" &&
    players.some((player) => !player.selectedCharacterId)
  ) {
    const missingCharacters = players
      .filter((player) => !player.selectedCharacterId)
      .map((player) => player.name)
      .join(", ");

    return en
      ? `These players need to choose a character first: ${missingCharacters}.`
      : `Diese Spieler muessen erst einen Charakter waehlen: ${missingCharacters}.`;
  }

  if (
    selectedGame.id === "arena-survivor" &&
    !isArenaSurvivorContinuingRun(room) &&
    !resolveArenaSurvivorSetupConfirmed(room)
  ) {
    return en
      ? "The host needs to confirm Arena Survivor on the setup screen first."
      : "Der Host muss Arena Survivor erst im Setup-Bildschirm bestaetigen.";
  }

  return null;
}

export function toRoomSnapshot(
  room: RoomRecord,
  availableGames: AvailableGameDto[]
): RoomSnapshot {
  const minionsTdSettings = room.gameSettingsByGameId["minions-td"] ?? {};
  const minionsTdConfiguredMapId =
    typeof minionsTdSettings[minionsTdRoomSettingKeys.selectedMapId] === "string"
      ? (minionsTdSettings[minionsTdRoomSettingKeys.selectedMapId] as string)
      : null;
  const minionsTdStartingLives =
    typeof minionsTdSettings[minionsTdRoomSettingKeys.startingLives] === "number"
      ? (minionsTdSettings[minionsTdRoomSettingKeys.startingLives] as number)
      : minionsTdSetupConfig.startingLives.defaultValue;
  const minionsTdStartingGold =
    typeof minionsTdSettings[minionsTdRoomSettingKeys.startingGold] === "number"
      ? (minionsTdSettings[minionsTdRoomSettingKeys.startingGold] as number)
      : minionsTdSetupConfig.startingGold.defaultValue;
  const arenaSurvivorCharacterOptions =
    room.selectedGameId === "arena-survivor"
      ? arenaSurvivorCharacterDefinitions.map((character) => ({
          id: character.id,
          name: character.name,
          title: character.title,
          archetype: character.archetype,
          description: character.description,
          portraitPath: `/arena-survivor/characters/portraits/${character.id}.svg`,
          visual: {
            primaryColor: character.visual.primaryColor,
            secondaryColor: character.visual.secondaryColor,
            accentColor: character.visual.accentColor
          }
        }))
      : undefined;
  const arenaSurvivorSettings = room.gameSettingsByGameId["arena-survivor"] ?? {};
  const arenaSurvivorLobby =
    room.selectedGameId === "arena-survivor"
      ? {
          difficulty: clampArenaSurvivorDifficultyTier(
            arenaSurvivorSettings[arenaSurvivorRoomSettingKeys.difficultyTier]
          ),
          setupConfirmed: resolveArenaSurvivorSetupConfirmed(room)
        }
      : undefined;
  const minionsTdLobby =
    room.selectedGameId === "minions-td"
      ? {
          maps: listMinionsTdMaps(),
          selectedMapId: resolveMinionsTdMap(minionsTdConfiguredMapId, room.roundCounter + 1).id,
          startingLives: Math.max(
            minionsTdSetupConfig.startingLives.min,
            Math.min(minionsTdSetupConfig.startingLives.max, minionsTdStartingLives)
          ),
          startingGold: Math.max(
            minionsTdSetupConfig.startingGold.min,
            Math.min(minionsTdSetupConfig.startingGold.max, minionsTdStartingGold)
          )
        }
      : undefined;
  const zeichnenUndErratenLobby =
    room.selectedGameId === "zeichnen-und-erraten"
      ? getZeichnenUndErratenLobbyState(
          room.gameSettingsByGameId["zeichnen-und-erraten"] ?? {},
          room.language
        )
      : undefined;

  return {
    code: room.code,
    createdAt: room.createdAt,
    joinUrl: room.joinUrl,
    language: room.language,
    hostConnected: room.hostSocketId !== null,
    lifecycle: deriveRoomLifecycle(room),
    selectedGameId: room.selectedGameId,
    availableGames,
    arenaSurvivorCharacterOptions,
    arenaSurvivorLobby,
    minionsTdLobby,
    zeichnenUndErratenLobby,
    players: [...room.players.values()]
      .sort((left, right) => left.joinedAt - right.joinedAt)
      .map((player) => ({
        id: player.id,
        name: player.name,
        color: player.color,
        selectedCharacterId: player.selectedCharacterId,
        selectedCharacterName: player.selectedCharacterId
          ? arenaSurvivorCharacterDefinitions.find((character) => character.id === player.selectedCharacterId)?.name ?? null
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
