import { networkInterfaces } from "node:os";

export interface AppEnv {
  port: number;
  host: string;
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

function isPrivateIPv4(address: string): boolean {
  return (
    address.startsWith("192.168.") ||
    address.startsWith("10.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(address)
  );
}

function findLanIPv4(): string | null {
  for (const networkInterface of Object.values(networkInterfaces())) {
    for (const addressInfo of networkInterface ?? []) {
      if (
        addressInfo.family === "IPv4" &&
        !addressInfo.internal &&
        isPrivateIPv4(addressInfo.address)
      ) {
        return addressInfo.address;
      }
    }
  }

  return null;
}

function readHost(source: NodeJS.ProcessEnv): string {
  return source.HOST?.trim() || "0.0.0.0";
}

function readPublicControllerOrigin(source: NodeJS.ProcessEnv): string {
  const configuredOrigin = source.PUBLIC_CONTROLLER_ORIGIN?.trim();

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  const lanIPv4 = findLanIPv4();
  return `http://${lanIPv4 ?? "localhost"}:5174`;
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
    host: readHost(source),
    publicControllerOrigin: readPublicControllerOrigin(source),
    connectionRecoveryMs: readNumber(source.CONNECTION_RECOVERY_MS, 120_000),
    playerReconnectWindowMs: readNumber(source.PLAYER_RECONNECT_WINDOW_MS, 45_000),
    roundTickMs: readNumber(source.ROUND_TICK_MS, 16),
    jsonSnapshotPath: source.JSON_SNAPSHOT_PATH ?? "./data/room-snapshots.json",
    fixedPrimaryRoomCode: readFixedPrimaryRoomCode(source)
  };
}
