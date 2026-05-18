import { getRoomPhase } from "@open-party-lab/protocol";
import QRCode from "qrcode";
import type { HostSocketClient } from "./hostSocketClient.js";
import { getHostText } from "../i18n/hostText.js";
import { hostTheme } from "../ui/theme/theme.js";
import {
  applyStyles,
  createChromeCard,
  createChromeSection,
  createChromeTextButton,
  hostChrome,
  trapChromePointerEvents
} from "../ui/chrome/hostChrome.js";

function shouldShowJoinOverlay(
  state: Parameters<HostSocketClient["subscribe"]>[0] extends (state: infer TState) => void ? TState : never
): boolean {
  const room = state.room;
  const lifecycle = getRoomPhase(room);

  if (!room) {
    return true;
  }

  if (room.selectedGameId === "arena-survivor" && lifecycle === "finished") {
    return false;
  }

  return lifecycle === "lobby" || lifecycle === "game_selected" || lifecycle === "finished";
}

export function mountJoinOverlay(client: HostSocketClient): () => void {
  const overlay = document.createElement("aside");
  trapChromePointerEvents(overlay);
  applyStyles(overlay, {
    position: "fixed",
    top: hostChrome.offset.edge,
    left: hostChrome.offset.edge,
    zIndex: hostChrome.zIndex.join,
    maxWidth: "min(320px, calc(100vw - 24px))",
    pointerEvents: "auto",
    display: "grid",
    gap: "10px"
  });

  let isMinimized = false;

  const minimizedButton = document.createElement("button");
  minimizedButton.type = "button";
  minimizedButton.title = "Handy-Controller anzeigen";
  minimizedButton.setAttribute("aria-label", "Handy-Controller anzeigen");
  minimizedButton.innerHTML = `
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M10 6h4" />
      <path d="M11 18h2" />
      <path d="M9 9h2v2H9z" />
      <path d="M13 9h2v2h-2z" />
      <path d="M9 13h2v2H9z" />
      <path d="M13 13h2" />
      <path d="M15 13v2" />
    </svg>
  `;
  applyStyles(minimizedButton, {
    display: "none",
    justifySelf: "start",
    width: "44px",
    height: "44px",
    padding: "0",
    border: hostChrome.border.bright,
    borderRadius: hostChrome.radius.pill,
    background: "linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(8, 47, 73, 0.86))",
    boxShadow: hostChrome.shadow.dock,
    color: hostTheme.text,
    fontFamily: "\"Space Grotesk\", sans-serif",
    fontSize: "16px",
    cursor: "pointer",
    backdropFilter: "blur(12px)",
    placeItems: "center",
    touchAction: "manipulation"
  });
  overlay.appendChild(minimizedButton);

  const card = createChromeCard("paper");
  overlay.appendChild(card);

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.gap = "12px";
  card.appendChild(header);

  const title = document.createElement("strong");
  title.textContent = "Handy-Controller";
  title.style.fontSize = "20px";
  header.appendChild(title);

  const minimizeButton = createChromeTextButton("Verstecken");
  minimizeButton.style.background = "#e2e8f0";
  minimizeButton.style.border = hostChrome.border.paper;
  minimizeButton.style.color = "#0f172a";
  header.appendChild(minimizeButton);

  const status = document.createElement("p");
  status.style.margin = "0";
  status.style.fontSize = "14px";
  status.style.lineHeight = "1.4";
  card.appendChild(status);

  const roomCode = createChromeSection("paper");
  roomCode.style.fontSize = "34px";
  roomCode.style.fontWeight = "900";
  roomCode.style.letterSpacing = "0.18em";
  roomCode.style.textAlign = "center";
  roomCode.style.padding = "8px 10px";
  card.appendChild(roomCode);

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  canvas.style.borderRadius = hostChrome.radius.section;
  canvas.style.background = "#ffffff";
  canvas.style.padding = "10px";
  card.appendChild(canvas);

  const link = document.createElement("a");
  link.target = "_blank";
  link.rel = "noreferrer";
  link.style.fontSize = "12px";
  link.style.lineHeight = "1.4";
  link.style.color = "#0f766e";
  link.style.wordBreak = "break-all";
  card.appendChild(link);

  const hint = document.createElement("small");
  hint.textContent = "Wenn am Handy die Host-Seite erscheint, stattdessen den QR-Code oder Port 5174 nutzen.";
  hint.style.color = "#475569";
  hint.style.lineHeight = "1.4";
  card.appendChild(hint);

  function renderMinimizedState(showOverlay: boolean): void {
    overlay.style.display = showOverlay ? "grid" : "none";
    overlay.style.pointerEvents = showOverlay ? "auto" : "none";
    overlay.style.left = isMinimized ? "" : hostChrome.offset.edge;
    overlay.style.right = isMinimized ? hostChrome.offset.edge : "";
    overlay.style.justifyItems = isMinimized ? "end" : "stretch";
    minimizedButton.style.display = showOverlay && isMinimized ? "grid" : "none";
    card.style.display = showOverlay && !isMinimized ? "grid" : "none";
  }

  minimizedButton.addEventListener("click", () => {
    isMinimized = false;
    renderMinimizedState(true);
  });

  minimizeButton.addEventListener("click", () => {
    isMinimized = true;
    renderMinimizedState(true);
  });

  document.body.appendChild(overlay);

  const unsubscribe = client.subscribe((state) => {
    const room = state.room;
    const showOverlay = shouldShowJoinOverlay(state);
    const text = getHostText(room?.language ?? state.preferredLanguage);

    minimizedButton.title = text.showPhoneController;
    minimizedButton.setAttribute("aria-label", text.showPhoneController);
    title.textContent = text.phoneController;
    minimizeButton.textContent = text.hide;
    hint.textContent = text.hostPageHint;

    renderMinimizedState(showOverlay);

    if (!room) {
      status.textContent = state.connected
        ? text.hostCreatingRoom
        : text.hostConnecting;
      roomCode.textContent = "----";
      canvas.style.display = "none";
      link.style.display = "none";
      hint.style.display = "none";
      link.textContent = "";
      link.removeAttribute("href");
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (!showOverlay) {
      return;
    }

    status.textContent = text.scanQr;
    roomCode.textContent = room.code;
    canvas.style.display = "block";
    link.style.display = "block";
    hint.style.display = "block";
    link.textContent = room.joinUrl;
    link.href = room.joinUrl;

    void QRCode.toCanvas(canvas, room.joinUrl, {
      margin: 1,
      width: 176,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    });
  });

  return () => {
    unsubscribe();
    overlay.remove();
  };
}
