import { getRoomPhase, hasActiveRound } from "@open-party-lab/protocol";
import type { HostSocketClient } from "./hostSocketClient.js";
import { getHostText } from "../i18n/hostText.js";
import { applyStyles, createChromeCard, hostChrome } from "../ui/chrome/hostChrome.js";

function shouldShowHudOverlay(
  state: Parameters<HostSocketClient["subscribe"]>[0] extends (state: infer TState) => void ? TState : never
): boolean {
  if (state.room?.selectedGameId === "arena-survivor") {
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
  card.style.background = "rgba(15, 23, 42, 0.72)";
  card.style.boxShadow = "0 16px 36px rgba(2, 6, 23, 0.24)";
  card.style.pointerEvents = "auto";
  overlay.appendChild(card);

  const line1 = document.createElement("strong");
  line1.style.fontSize = "16px";
  card.appendChild(line1);

  const line2 = document.createElement("div");
  line2.style.fontSize = "13px";
  line2.style.color = "#cbd5e1";
  card.appendChild(line2);

  const line3 = document.createElement("div");
  line3.style.fontSize = "12px";
  line3.style.color = "#94a3b8";
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
