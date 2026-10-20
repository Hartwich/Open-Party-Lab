import { getRoomPhase, hasActiveRound } from "@open-party-lab/protocol";
import type { HostAppState, HostSocketClient } from "./hostSocketClient.js";
import { getSelectedGameChrome } from "../games/selectedGame.js";
import { getHostText } from "../i18n/hostText.js";
import { applyStyles, createChromeCard, hostChrome } from "../ui/chrome/hostChrome.js";

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
    maxWidth: "min(520px, calc(100vw - 24px))",
    pointerEvents: "none"
  });

  const card = createChromeCard("dark");
  card.style.gap = "8px";
  card.style.padding = "14px 16px";
  card.style.boxShadow = hostChrome.shadow.card;
  card.style.pointerEvents = "auto";
  card.style.border = "1px solid rgba(232, 189, 79, 0.45)";
  overlay.appendChild(card);

  const line1 = document.createElement("strong");
  line1.style.fontSize = "16px";
  card.appendChild(line1);

  const line2 = document.createElement("div");
  line2.style.fontSize = "13px";
  line2.style.color = "var(--ink-soft)";
  card.appendChild(line2);

  const instruction = document.createElement("div");
  instruction.style.display = "grid";
  instruction.style.gap = "4px";
  instruction.style.padding = "10px 12px";
  instruction.style.borderRadius = "12px";
  instruction.style.background = "rgba(53, 208, 127, 0.12)";
  instruction.style.border = "1px solid rgba(53, 208, 127, 0.4)";
  instruction.style.fontSize = "13px";
  instruction.style.lineHeight = "1.5";
  instruction.style.color = "#f8fafc";

  const instructionTitle = document.createElement("strong");
  instructionTitle.textContent = "Instructions";
  instruction.appendChild(instructionTitle);

  const instructionText = document.createElement("div");
  instruction.appendChild(instructionText);

  card.appendChild(instruction);

  const line3 = document.createElement("div");
  line3.style.fontSize = "12px";
  line3.style.color = "var(--muted)";
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
    const message = state.game?.message;

    overlay.style.display = showOverlay ? "block" : "none";

    if (!showOverlay) {
      return;
    }

    line1.textContent = `${text.roomPrefix} ${state.room?.code ?? "----"} · ${gameName}`;
    line2.textContent = `${state.connected ? text.serverOnline : text.serverOffline} · ${text.players}: ${connectedPlayers}/${totalPlayers}`;
    instructionTitle.textContent = state.room?.language === "de" ? "Anleitung" : state.room?.language === "ar" ? "التعليمات" : "Instructions";
    if (message) {
      instructionText.textContent = message;
      instruction.style.display = "grid";
    } else {
      instruction.style.display = "none";
    }
    line3.textContent = state.error ?? text.readyNextTitle;
    card.style.padding = roundActive ? "10px 14px" : "14px 16px";
  });

  return () => {
    unsubscribe();
    overlay.remove();
  };
}

  return () => {
    unsubscribe();
    overlay.remove();
  };
}
