import type { WordTilesExchangeInput, WordTilesPassInput, WordTilesPlacementState, WordTilesPlayInput } from "@open-party-lab/protocol";

export function createWordTilesPlayInput(
  playerId: string,
  placements: WordTilesPlacementState[]
): WordTilesPlayInput {
  return {
    type: "word-tiles:play",
    playerId,
    placements,
    sentAt: Date.now()
  };
}

export function createWordTilesPassInput(playerId: string): WordTilesPassInput {
  return {
    type: "word-tiles:pass",
    playerId,
    sentAt: Date.now()
  };
}

export function createWordTilesExchangeInput(
  playerId: string,
  tileIds: string[]
): WordTilesExchangeInput {
  return {
    type: "word-tiles:exchange",
    playerId,
    tileIds,
    sentAt: Date.now()
  };
}
