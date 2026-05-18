export interface GameVisual {
  accent: number;
  accentSoft: number;
  surface: number;
  surfaceHover: number;
  eyebrow: string;
}

const defaultVisual: GameVisual = {
  accent: 0x38bdf8,
  accentSoft: 0x7dd3fc,
  surface: 0x0f172a,
  surfaceHover: 0x162033,
  eyebrow: "Party"
};

const gameVisuals: Record<string, GameVisual> = {
  "chaos-kommando": {
    accent: 0xf97316,
    accentSoft: 0xfdba74,
    surface: 0x24130a,
    surfaceHover: 0x351d10,
    eyebrow: "Artillery"
  },
  "zeichnen-und-erraten": {
    accent: 0x38bdf8,
    accentSoft: 0xbae6fd,
    surface: 0x0a1a2a,
    surfaceHover: 0x10283d,
    eyebrow: "Drawing"
  },
  schaetzorama: {
    accent: 0xfacc15,
    accentSoft: 0x7dd3fc,
    surface: 0x1f1534,
    surfaceHover: 0x32204f,
    eyebrow: "Quiz"
  },
  "arena-survivor": {
    accent: 0xf97316,
    accentSoft: 0xfb923c,
    surface: 0x22130e,
    surfaceHover: 0x31201a,
    eyebrow: "Arena"
  },
  "minions-td": {
    accent: 0x22c55e,
    accentSoft: 0x86efac,
    surface: 0x0b1f1c,
    surfaceHover: 0x14302d,
    eyebrow: "Tower Defense"
  },
  imposter: {
    accent: 0xc084fc,
    accentSoft: 0xe9d5ff,
    surface: 0x1d1230,
    surfaceHover: 0x2a1946,
    eyebrow: "Bluff"
  },
  tabu: {
    accent: 0x60a5fa,
    accentSoft: 0xbfdbfe,
    surface: 0x0c1930,
    surfaceHover: 0x132547,
    eyebrow: "Words"
  },
  pantomime: {
    accent: 0xa78bfa,
    accentSoft: 0xddd6fe,
    surface: 0x17132b,
    surfaceHover: 0x211b42,
    eyebrow: "Acting"
  },
  "tap-race": {
    accent: 0x14b8a6,
    accentSoft: 0x99f6e4,
    surface: 0x0b201f,
    surfaceHover: 0x12302e,
    eyebrow: "Mash"
  },
  "air-hockey": {
    accent: 0x06b6d4,
    accentSoft: 0xa5f3fc,
    surface: 0x08202a,
    surfaceHover: 0x0d3040,
    eyebrow: "Duel"
  },
  "light-trails": {
    accent: 0xa78bfa,
    accentSoft: 0xddd6fe,
    surface: 0x16132b,
    surfaceHover: 0x1f1b3f,
    eyebrow: "Arcade"
  }
};

export function getGameVisual(gameId: string): GameVisual {
  return gameVisuals[gameId] ?? defaultVisual;
}

export function getVisualAccent(gameId: string | null | undefined): number {
  return gameId ? getGameVisual(gameId).accent : defaultVisual.accent;
}
