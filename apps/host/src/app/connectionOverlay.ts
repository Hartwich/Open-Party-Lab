import type { HostSocketClient } from "./hostSocketClient.js";
import { getHostText } from "../i18n/hostText.js";

export function mountConnectionOverlay(client: HostSocketClient): () => void {
  const banner = document.createElement("div");
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");
  banner.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:10000;padding:14px 20px;background:var(--paper-deep,#f6dfac);color:var(--text-main,#352436);text-align:center;font:700 18px system-ui;box-shadow:0 2px 12px #0002;pointer-events:none";
  document.body.append(banner);
  const unsubscribe = client.subscribe((state) => {
    banner.hidden = state.connected || !state.room;
    banner.textContent = getHostText(state.preferredLanguage).reconnectingToRoom;
  });
  return () => { unsubscribe(); banner.remove(); };
}
