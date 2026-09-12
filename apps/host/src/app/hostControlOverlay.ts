import type { HostSocketClient } from "./hostSocketClient.js";
import { getHostText } from "../i18n/hostText.js";
import {
  applyStyles,
  createChromeCard,
  createChromeTextButton,
  hostChrome
} from "../ui/chrome/hostChrome.js";

/**
 * Shared-screen side of remote host control.
 *
 * Two things reach this layer, and only while they are true: a handover that is
 * waiting on an answer, and a round that somebody has paused.
 *
 * The screen is no longer asked when a phone takes *its* controls — there is
 * nobody standing at the screen to press a button, and a prompt nobody answers
 * is a dead end, so a free set of controls is simply taken. What remains is a
 * handover between two players: the holder decides, and the screen sees the
 * same question because it is the room's fallback if that phone is unattended.
 * Either way the deadline in the request settles it.
 *
 * Deliberately a DOM overlay rather than a Phaser scene: both messages have to
 * stay visible on top of any game, including the ones that own the whole canvas.
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
  title.style.fontFamily = "var(--font-display)";
  title.style.fontSize = "20px";
  card.appendChild(title);

  const body = document.createElement("p");
  body.style.margin = "0";
  body.style.fontSize = "15px";
  body.style.lineHeight = "1.4";
  card.appendChild(body);

  const hint = document.createElement("small");
  hint.style.color = "var(--muted)";
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
    const pausedBy = state.room?.pausedBy ?? null;

    pendingPlayerId = request?.playerId ?? null;

    if (request) {
      overlay.style.display = "block";
      actions.style.display = "flex";
      title.textContent = text.hostControlRequestTitle;
      body.textContent = text.hostControlRequestBody(request.playerName);
      hint.textContent = text.hostControlRequestHint;
      allowButton.textContent = text.hostControlAllow;
      denyButton.textContent = text.hostControlDeny;
      return;
    }

    // A frozen game with no explanation looks like a crash, so the screen says
    // who everyone is waiting on. There is nothing for the screen to press —
    // the phone that opened the menu is the one that closes it.
    if (pausedBy) {
      overlay.style.display = "block";
      actions.style.display = "none";
      title.textContent = text.roundPausedTitle;
      body.textContent = pausedBy.playerName
        ? text.roundPausedByPlayer(pausedBy.playerName)
        : text.roundPausedByScreen;
      hint.textContent = text.roundPausedHint;
      return;
    }

    overlay.style.display = "none";
  });

  return () => {
    unsubscribe();
    overlay.remove();
  };
}
