import { ROOM_EXTENSION_WINDOW_MS } from "@open-party-lab/protocol";
import type { HostSocketClient } from "./hostSocketClient.js";
import { getHostText } from "../i18n/hostText.js";
import { applyStyles, createChromeCard, createChromeTextButton, hostChrome, trapChromePointerEvents } from "../ui/chrome/hostChrome.js";

/** Mounted once for the hosted app, independently of the current game or catalog. */
export function mountRoomExpiryOverlay(client: HostSocketClient): () => void {
  const element = document.createElement("aside");
  element.className = "opl-room-expiry";
  element.setAttribute("aria-live", "polite");
  trapChromePointerEvents(element);
  applyStyles(element, {
    position: "fixed", top: "18px", left: "50%", transform: "translateX(-50%)",
    zIndex: hostChrome.zIndex.controls, width: "min(480px, calc(100vw - 36px))"
  });
  const card = createChromeCard("paper");
  const title = document.createElement("strong");
  const body = document.createElement("div");
  const status = document.createElement("div");
  status.setAttribute("role", "status");
  status.style.color = "var(--danger)";
  const button = createChromeTextButton("", "accent");
  card.append(title, body, status, button);
  element.append(card);
  document.body.append(element);

  let pending = false;
  let error: string | null = null;
  let successUntil = 0;
  let roomCode: string | undefined;
  let destroyed = false;
  const render = () => {
    const state = client.getState();
    if (roomCode !== state.room?.code) {
      roomCode = state.room?.code;
      error = null;
      successUntil = 0;
    }
    const text = getHostText(state.room?.language ?? state.preferredLanguage);
    const remaining = (state.room?.expiresAt ?? 0) - client.getServerTime();
    const success = Date.now() < successUntil;
    element.hidden = !state.room || (!success && !pending && (remaining <= 0 || remaining > ROOM_EXTENSION_WINDOW_MS));
    title.textContent = success ? text.roomExpiryExtended : text.roomExpiryTitle;
    const seconds = Math.max(0, Math.ceil(remaining / 1000));
    body.textContent = text.roomExpiryCountdown(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`);
    body.hidden = success;
    button.hidden = success;
    button.disabled = pending || !state.connected;
    button.textContent = pending ? text.roomExpiryExtending : text.roomExpiryExtend;
    status.textContent = error ?? (!state.connected ? text.connectionMissing : "");
    status.hidden = !status.textContent;
  };
  button.addEventListener("click", async () => {
    if (pending) return;
    pending = true;
    error = null;
    render();
    const requestedRoom = roomCode;
    const result = await client.extendRoomLifetime();
    if (destroyed) return;
    pending = false;
    if (requestedRoom === client.getState().room?.code) {
      error = result;
      if (!result) successUntil = Date.now() + 5_000;
    }
    render();
  });
  const unsubscribe = client.subscribe(render);
  // Keep ticking even before the warning window; quiet lobbies receive few events.
  const timer = window.setInterval(render, 1000);
  return () => { destroyed = true; unsubscribe(); window.clearInterval(timer); element.remove(); };
}
