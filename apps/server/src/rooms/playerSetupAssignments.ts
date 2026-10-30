import type { GameManifest } from "@open-party-lab/game-core";
import type { RoomRecord } from "./roomStore.js";

/** Assign only missing choices. Existing choices (including reconnects) stay intact. */
export function assignPlayerSetup(room: RoomRecord, game: Pick<GameManifest, "id" | "playerSetup">, shuffle = false): void {
  const setup = game.playerSetup;
  if (!setup || setup.kind !== "choice" || setup.assignment !== "balanced-random" || !setup.options.length) return;
  if (room.currentRound && room.currentRound.phase !== "finished") return;
  const key = setup.selectionKey ?? "character";
  const counts = new Map(setup.options.map((option) => [option.id, 0]));
  const waiting = [];
  for (const player of room.players.values()) {
    const value = player.setupSelectionsByGameId[game.id]?.[key];
    if (!shuffle && typeof value === "string" && counts.has(value)) counts.set(value, counts.get(value)! + 1);
    else waiting.push(player);
  }
  for (let i = waiting.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [waiting[i], waiting[j]] = [waiting[j], waiting[i]];
  }
  for (const player of waiting) {
    const minimum = Math.min(...counts.values());
    const candidates = setup.options.filter((option) => counts.get(option.id) === minimum);
    const choice = candidates[Math.floor(Math.random() * candidates.length)].id;
    counts.set(choice, counts.get(choice)! + 1);
    player.setupSelectionsByGameId[game.id] = { ...player.setupSelectionsByGameId[game.id], [key]: choice };
    player.selectedCharacterId = choice;
    if (shuffle) player.isReady = false;
  }
}
