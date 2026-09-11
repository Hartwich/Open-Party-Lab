import type { HostSocketClient, HostAppState } from "./hostSocketClient.js";

/** Small hosted-only reminder; local rooms intentionally keep the shared screen clean. */
export function mountRoomExpiryOverlay(client: HostSocketClient): () => void {
  const element = document.createElement("aside");
  element.className = "opl-room-expiry";
  element.setAttribute("aria-live", "polite");
  document.body.appendChild(element);
  let timer: number | undefined;
  const render = (state: HostAppState) => {
    if (timer !== undefined) window.clearTimeout(timer);
    const expiresAt = state.room?.expiresAt ?? 0;
    const remaining = expiresAt - Date.now();
    if (!state.room || remaining > 10 * 60 * 1000) { element.replaceChildren(); element.hidden = true; return; }
    const minutes = Math.max(0, Math.ceil(remaining / 60_000));
    element.hidden = false;
    element.innerHTML = `<strong>Raum endet in ${minutes} Min.</strong><button type="button">Raum verlängern</button>`;
    element.querySelector("button")?.addEventListener("click", () => client.extendRoomLifetime(), { once: true });
    timer = window.setTimeout(() => render(client.getState()), 30_000);
  };
  const unsubscribe = client.subscribe(render);
  render(client.getState());
  const style = document.createElement("style");
  style.textContent = ".opl-room-expiry{position:fixed;right:18px;bottom:18px;z-index:20;display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink);box-shadow:var(--shadow-card);font:700 13px var(--font-body)}.opl-room-expiry[hidden]{display:none}.opl-room-expiry button{padding:7px 9px;border:1px solid var(--accent);border-radius:6px;background:var(--accent);color:var(--on-accent);font:inherit;cursor:pointer}";
  document.head.appendChild(style);
  return () => { unsubscribe(); if (timer !== undefined) window.clearTimeout(timer); element.remove(); style.remove(); };
}
