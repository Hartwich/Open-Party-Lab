import { getRoomPhase, hasActiveRound } from "@open-party-lab/protocol";
import type { HostAppState, HostSocketClient } from "./hostSocketClient.js";
import { getSelectedGameChrome } from "../games/selectedGame.js";
import { getHostText } from "../i18n/hostText.js";
import { applyStyles, createChromeCard, hostChrome } from "../ui/chrome/hostChrome.js";
import { hostTheme } from "../ui/theme/theme.js";

function shouldShowHudOverlay(state: HostAppState): boolean {
  // Games that fill the screen themselves opt out via their manifest.
  if (!getSelectedGameChrome(state).hud) {
    return false;
  }

  const lifecycle = getRoomPhase(state.room);

  return lifecycle !== "lobby" && lifecycle !== "game_selected" && lifecycle !== "finished";
}

export function mountHudOverlay(client: HostSocketClient): () => void {
  const overlay = document.createElement("div");
  applyStyles(overlay, {
    position: "fixed",
    left: hostChrome.offset.edge,
    top: hostChrome.offset.edge,
    zIndex: hostChrome.zIndex.hud,
    maxWidth: "min(440px, calc(100vw - 24px))",
    pointerEvents: "none"
  });

  const card = createChromeCard("dark");
  card.style.gap = "6px";
  card.style.padding = "12px 14px";
  card.style.boxShadow = hostChrome.shadow.card;
  card.style.pointerEvents = "auto";
  overlay.appendChild(card);

  const line1 = document.createElement("strong");
  line1.style.fontSize = "16px";
  card.appendChild(line1);

  const line2 = document.createElement("div");
  line2.style.fontSize = "13px";
  line2.style.color = hostTheme.textSoft;
  card.appendChild(line2);

  const line3 = document.createElement("div");
  line3.style.fontSize = "12px";
  line3.style.color = hostTheme.muted;
  card.appendChild(line3);

  document.body.appendChild(overlay);

  const unsubscribe = client.subscribe((state) => {
    const showOverlay = shouldShowHudOverlay(state);
    const text = getHostText(state.room?.language ?? state.preferredLanguage);
    const gameName =
      state.room?.availableGames.find((game) => game.id === state.room?.selectedGameId)?.displayName ??
      text.noGame;
    const connectedPlayers = (state.room?.players ?? []).filter((player) => player.connected).length;
    const totalPlayers = state.room?.players.length ?? 0;
    const roundActive = hasActiveRound(state.room);

    overlay.style.display = showOverlay ? "block" : "none";

    if (!showOverlay) {
      return;
    }

    line1.textContent = `${text.roomPrefix} ${state.room?.code ?? "----"}`;
    line2.textContent = `${gameName} | ${state.connected ? text.serverOnline : text.serverOffline} | ${text.players}: ${connectedPlayers}/${totalPlayers}`;
    line3.textContent = state.game?.message ?? state.error ?? text.readyNextTitle;
    line2.style.display = roundActive ? "none" : "block";
    line3.style.display = roundActive ? "none" : "block";
    card.style.padding = roundActive ? "8px 12px" : "12px 14px";
  });

  return () => {
    unsubscribe();
    overlay.remove();
  };
}
