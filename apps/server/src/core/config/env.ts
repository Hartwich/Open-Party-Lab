export interface AppEnv {
  port: number;
  publicControllerOrigin: string;
  connectionRecoveryMs: number;
  playerReconnectWindowMs: number;
  roundTickMs: number;
  jsonSnapshotPath: string;
  fixedPrimaryRoomCode: string | null;
}

function readNumber(value: string | undefined, fallbackValue: number): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

function readFixedPrimaryRoomCode(source: NodeJS.ProcessEnv): string | null {
  const configuredCode = source.PRIMARY_ROOM_CODE?.trim().toUpperCase();

  if (configuredCode) {
    return /^[A-Z0-9]{4}$/.test(configuredCode) ? configuredCode : null;
  }

  return source.NODE_ENV === "production" ? null : "DEBU";
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return {
    port: readNumber(source.PORT, 3000),
    publicControllerOrigin: source.PUBLIC_CONTROLLER_ORIGIN ?? "http://localhost:5174",
    connectionRecoveryMs: readNumber(source.CONNECTION_RECOVERY_MS, 120_000),
    playerReconnectWindowMs: readNumber(source.PLAYER_RECONNECT_WINDOW_MS, 45_000),
    roundTickMs: readNumber(source.ROUND_TICK_MS, 16),
    jsonSnapshotPath: source.JSON_SNAPSHOT_PATH ?? "./data/room-snapshots.json",
    fixedPrimaryRoomCode: readFixedPrimaryRoomCode(source)
  };
}
