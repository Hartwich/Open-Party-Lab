const deviceIdKey = "open-party-lab.device-id";
const reconnectTokenKey = "open-party-lab.reconnect-session";

export interface StoredControllerSession {
  reconnectToken: string;
  roomCode: string;
  playerId: string;
  playerName: string;
  savedAt: number;
}

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getOrCreateDeviceId(): string {
  if (!hasLocalStorage()) {
    return "device-unavailable";
  }

  const existingValue = window.localStorage.getItem(deviceIdKey);

  if (existingValue) {
    return existingValue;
  }

  const createdValue = createDeviceId();
  window.localStorage.setItem(deviceIdKey, createdValue);
  return createdValue;
}

export function rotateDeviceId(): string {
  if (!hasLocalStorage()) {
    return "device-unavailable";
  }

  const createdValue = createDeviceId();
  window.localStorage.setItem(deviceIdKey, createdValue);
  return createdValue;
}

export function clearDeviceId(): void {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(deviceIdKey);
}

function createDeviceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadReconnectToken(): string | null {
  return loadStoredSession()?.reconnectToken ?? null;
}

export function loadStoredSession(): StoredControllerSession | null {
  if (!hasLocalStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(reconnectTokenKey);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredControllerSession;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: StoredControllerSession): void {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.setItem(reconnectTokenKey, JSON.stringify(session));
}

export function clearReconnectToken(): void {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(reconnectTokenKey);
}

export function clearStoredControllerIdentity(): void {
  clearReconnectToken();
  clearDeviceId();
}

export function readPrefilledRoomCode(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const hashValue = window.location.hash.replace(/^#/, "");

  if (!hashValue) {
    return "";
  }

  const [path, queryString] = hashValue.split("?");

  if (path !== "join" || !queryString) {
    return "";
  }

  const query = new URLSearchParams(queryString);
  return (query.get("room") ?? "").toUpperCase();
}
