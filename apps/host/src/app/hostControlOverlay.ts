import type { HostSocketClient } from "./hostSocketClient.js";
import { getHostText } from "../i18n/hostText.js";
import { hostTheme } from "../ui/theme/theme.js";
import {
  applyStyles,
  createChromeCard,
  createChromeTextButton,
  hostChrome
} from "../ui/chrome/hostChrome.js";

/**
 * Shared-screen side of remote host control.
 *
 * Shows the approval prompt while a phone is asking for the controls — and
 * nothing else. Who currently holds the controls is status, not an interruption,
 * so it lives in the host settings panel instead of sitting on the shared screen
 * for the rest of the evening.
 *
 * Deliberately a DOM overlay rather than a Phaser scene: the prompt has to stay
 * visible on top of any game, including the ones that own the whole canvas.
 */
export function mountHostControlOverlay(client: HostSocketClient): () => void {
  const overlay = document.createElement("div");
  applyStyles(overlay, {
    position: "fixed",
    top: hostChrome.offset.edge,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: hostChrome.zIndex.controls,
    display: "none",
    width: "min(460px, calc(100vw - 32px))",
    pointerEvents: "auto"
  });

  const card = createChromeCard("paper");
  card.style.gap = "10px";
  overlay.appendChild(card);

  const title = document.createElement("strong");
  title.style.fontFamily = hostTheme.titleFont;
  title.style.fontSize = "20px";
  card.appendChild(title);

  const body = document.createElement("p");
  body.style.margin = "0";
  body.style.fontSize = "15px";
  body.style.lineHeight = "1.4";
  card.appendChild(body);

  const hint = document.createElement("small");
  hint.style.color = hostTheme.muted;
  hint.style.lineHeight = "1.4";
  card.appendChild(hint);

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "8px";
  actions.style.flexWrap = "wrap";
  card.appendChild(actions);

  const allowButton = createChromeTextButton("", "accent");
  const denyButton = createChromeTextButton("", "neutral");
  actions.append(allowButton, denyButton);

  /** The request we last rendered, so the buttons always answer the right one. */
  let pendingPlayerId: string | null = null;

  allowButton.addEventListener("click", () => {
    if (pendingPlayerId) {
      client.resolveHostControl(pendingPlayerId, true);
    }
  });

  denyButton.addEventListener("click", () => {
    if (pendingPlayerId) {
      client.resolveHostControl(pendingPlayerId, false);
    }
  });

  document.body.appendChild(overlay);

  const unsubscribe = client.subscribe((state) => {
    const text = getHostText(state.room?.language ?? state.preferredLanguage);
    const request = state.room?.hostControl.pendingRequest ?? null;

    pendingPlayerId = request?.playerId ?? null;

    if (!request) {
      overlay.style.display = "none";
      return;
    }

    overlay.style.display = "block";
    title.textContent = text.hostControlRequestTitle;
    body.textContent = text.hostControlRequestBody(request.playerName);
    hint.textContent = text.hostControlRequestHint;
    allowButton.textContent = text.hostControlAllow;
    denyButton.textContent = text.hostControlDeny;
  });

  return () => {
    unsubscribe();
    overlay.remove();
  };
}
