function normalize(x: number, y: number): { x: number; y: number } {
  const magnitude = Math.hypot(x, y);

  if (magnitude <= 0.0001) {
    return { x: 0, y: 0 };
  }

  if (magnitude <= 1) {
    return { x, y };
  }

  return {
    x: x / magnitude,
    y: y / magnitude
  };
}

export function createChaosKommandoMoveInput(playerId: string, moveX: number, moveY: number) {
  const normalized = normalize(moveX, moveY);

  return {
    type: "move" as const,
    playerId,
    moveX: normalized.x,
    moveY: normalized.y,
    sentAt: Date.now()
  };
}

export function createChaosKommandoAimInput(playerId: string, aimX: number, aimY: number) {
  const normalized = normalize(aimX, aimY);

  return {
    type: "aim" as const,
    playerId,
    aimX: normalized.x,
    aimY: normalized.y,
    sentAt: Date.now()
  };
}

export function createChaosKommandoJumpInput(playerId: string) {
  return {
    type: "jump" as const,
    playerId,
    sentAt: Date.now()
  };
}

export function createChaosKommandoSelectMercenaryInput(playerId: string, mercenaryId: string) {
  return {
    type: "select-mercenary" as const,
    playerId,
    mercenaryId,
    sentAt: Date.now()
  };
}

export function createChaosKommandoSelectWeaponInput(playerId: string, weaponId: string) {
  return {
    type: "select-weapon" as const,
    playerId,
    weaponId,
    sentAt: Date.now()
  };
}

export function createChaosKommandoFireStartInput(playerId: string) {
  return {
    type: "fire:start" as const,
    playerId,
    sentAt: Date.now()
  };
}

export function createChaosKommandoFireReleaseInput(playerId: string) {
  return {
    type: "fire:release" as const,
    playerId,
    sentAt: Date.now()
  };
}
