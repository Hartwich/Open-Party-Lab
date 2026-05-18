export const arenaSurvivorProjectileDefinition = {
  id: "starter-projectile",
  // Shared projectile fallback. Individual weapon projectiles override these.
  radius: 6,
  speed: 520,
  damage: 1,
  lifetimeMs: 2_500,
  maxRange: 900,
  pierce: 1
} as const;

export const arenaSurvivorProjectileDefinitions = [
  arenaSurvivorProjectileDefinition,
  {
    id: "pistol-round",
    radius: 4,
    speed: 720,
    damage: 1,
    lifetimeMs: 2_500,
    maxRange: 520,
    pierce: 1
  },
  {
    id: "hunter-arrow",
    radius: 5,
    speed: 830,
    damage: 9,
    lifetimeMs: 2_950,
    maxRange: 640,
    pierce: 1
  },
  {
    id: "smg-pellet",
    radius: 3,
    speed: 820,
    damage: 1,
    lifetimeMs: 2_200,
    maxRange: 420,
    pierce: 1
  },
  {
    id: "ember-orb",
    radius: 6,
    speed: 620,
    damage: 5,
    lifetimeMs: 2_650,
    maxRange: 500,
    pierce: 1
  },
  {
    id: "frost-shard",
    radius: 6,
    speed: 560,
    damage: 3,
    lifetimeMs: 2_700,
    maxRange: 470,
    pierce: 1
  },
  {
    id: "spark-bolt",
    radius: 4,
    speed: 980,
    damage: 1,
    lifetimeMs: 2_000,
    maxRange: 420,
    pierce: 1
  },
  {
    id: "coil-spike",
    radius: 4,
    speed: 900,
    damage: 1,
    lifetimeMs: 2_600,
    maxRange: 620,
    pierce: 1
  },
  {
    id: "gear-shot",
    radius: 5,
    speed: 650,
    damage: 1,
    lifetimeMs: 1_800,
    maxRange: 380,
    pierce: 1
  },
  {
    id: "venom-dart",
    radius: 4,
    speed: 600,
    damage: 1,
    lifetimeMs: 2_250,
    maxRange: 420,
    pierce: 1
  },
  {
    id: "prism-shard",
    radius: 6,
    speed: 760,
    damage: 1,
    lifetimeMs: 2_550,
    maxRange: 560,
    pierce: 1
  },
  {
    id: "ember-bolt",
    radius: 6,
    speed: 330,
    damage: 11,
    lifetimeMs: 2_400,
    maxRange: 520,
    pierce: 1
  },
  {
    id: "toxic-spore",
    radius: 7,
    speed: 275,
    damage: 9,
    lifetimeMs: 2_600,
    maxRange: 560,
    pierce: 1
  },
  {
    id: "crimson-orb",
    radius: 10,
    speed: 280,
    damage: 18,
    lifetimeMs: 3_200,
    maxRange: 640,
    pierce: 1
  }
] as const;

export const arenaSurvivorProjectileDefinitionsById = Object.fromEntries(
  arenaSurvivorProjectileDefinitions.map((projectile) => [projectile.id, projectile])
);
