export function createDrawingStartInput(playerId: string, x: number, y: number) {
  return {
    type: "draw:start",
    playerId,
    x,
    y,
    sentAt: Date.now()
  };
}

export function createDrawingMoveInput(playerId: string, x: number, y: number) {
  return {
    type: "draw:move",
    playerId,
    x,
    y,
    sentAt: Date.now()
  };
}

export function createDrawingEndInput(playerId: string) {
  return {
    type: "draw:end",
    playerId,
    sentAt: Date.now()
  };
}

export function createDrawingClearInput(playerId: string) {
  return {
    type: "draw:clear",
    playerId,
    sentAt: Date.now()
  };
}

export function createDrawingSetColorInput(playerId: string, color: string) {
  return {
    type: "draw:set-color",
    playerId,
    color,
    sentAt: Date.now()
  };
}

export function createGuessSubmitInput(playerId: string, guess: string) {
  return {
    type: "guess:submit",
    playerId,
    guess,
    sentAt: Date.now()
  };
}
