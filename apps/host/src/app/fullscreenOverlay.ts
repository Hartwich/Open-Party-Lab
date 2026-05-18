import type { HostSocketClient } from "./hostSocketClient.js";
import { getHostText } from "../i18n/hostText.js";
import {
  applyStyles,
  createChromeIconButton,
  hostChrome,
  setChromeIconButtonState,
  trapChromePointerEvents
} from "../ui/chrome/hostChrome.js";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function isFullscreenActive(targetDocument: FullscreenDocument): boolean {
  return Boolean(targetDocument.fullscreenElement ?? targetDocument.webkitFullscreenElement);
}

async function enterFullscreen(targetDocument: FullscreenDocument): Promise<void> {
  const rootElement = targetDocument.documentElement as FullscreenElement;

  if (typeof rootElement.requestFullscreen === "function") {
    await rootElement.requestFullscreen();
    return;
  }

  if (typeof rootElement.webkitRequestFullscreen === "function") {
    await rootElement.webkitRequestFullscreen();
  }
}

async function exitFullscreen(targetDocument: FullscreenDocument): Promise<void> {
  if (typeof targetDocument.exitFullscreen === "function") {
    await targetDocument.exitFullscreen();
    return;
  }

  if (typeof targetDocument.webkitExitFullscreen === "function") {
    await targetDocument.webkitExitFullscreen();
  }
}

export function mountFullscreenOverlay(client: HostSocketClient): () => void {
  const targetDocument = document as FullscreenDocument;
  const overlay = document.createElement("div");
  trapChromePointerEvents(overlay);
  applyStyles(overlay, {
    position: "fixed",
    right: hostChrome.offset.edge,
    bottom: `calc(${hostChrome.offset.dockBottom} + 64px)`,
    zIndex: hostChrome.zIndex.dock,
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    justifyContent: "center"
  });

  const menuIcon = `
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
      <path d="M5 7h14" />
      <path d="M5 12h14" />
      <path d="M5 17h14" />
    </svg>
  `;
  const fullscreenIcon = `
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 4H4v4" />
      <path d="M16 4h4v4" />
      <path d="M20 16v4h-4" />
      <path d="M4 16v4h4" />
      <path d="M9 9 4 4" />
      <path d="M15 9 20 4" />
      <path d="M15 15 20 20" />
      <path d="M9 15 4 20" />
    </svg>
  `;

  const gameSelectButton = createChromeIconButton("Spieluebersicht", menuIcon);
  const fullscreenButton = createChromeIconButton("Vollbild", fullscreenIcon);
  overlay.appendChild(gameSelectButton);
  overlay.appendChild(fullscreenButton);
  document.body.appendChild(overlay);

  function updateButtonLabel(): void {
    const state = client.getState();
    const text = getHostText(state.room?.language ?? state.preferredLanguage);
    const active = isFullscreenActive(targetDocument);
    setChromeIconButtonState(fullscreenButton, {
      active,
      label: active ? `${text.exitFullscreen} (F)` : `${text.fullscreen} (F)`
    });
  }

  function updateGameSelectButton(): void {
    const state = client.getState();
    const text = getHostText(state.room?.language ?? state.preferredLanguage);
    const canOpenCatalog = Boolean(state.room);
    setChromeIconButtonState(gameSelectButton, {
      disabled: !canOpenCatalog,
      label: canOpenCatalog ? `${text.gameSelectionFallback} (G)` : text.waitingForRoom
    });
  }

  async function toggleFullscreen(): Promise<void> {
    try {
      if (isFullscreenActive(targetDocument)) {
        await exitFullscreen(targetDocument);
        return;
      }

      await enterFullscreen(targetDocument);
    } catch {
      updateButtonLabel();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.repeat) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const tagName = target?.tagName;
    const isFormField =
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      tagName === "SELECT" ||
      target?.isContentEditable === true;

    const key = event.key.toLowerCase();

    if (isFormField) {
      return;
    }

    if (key === "f") {
      event.preventDefault();
      void toggleFullscreen();
      return;
    }

    if (key === "g") {
      if (gameSelectButton.disabled) {
        return;
      }

      event.preventDefault();
      client.returnToGameSelection();
      return;
    }
  }

  fullscreenButton.addEventListener("click", (event) => {
    (event.currentTarget as HTMLButtonElement).blur();
    void toggleFullscreen();
  });
  gameSelectButton.addEventListener("click", (event) => {
    if (gameSelectButton.disabled) {
      return;
    }

    (event.currentTarget as HTMLButtonElement).blur();
    client.returnToGameSelection();
  });

  targetDocument.addEventListener("fullscreenchange", updateButtonLabel);
  targetDocument.addEventListener("webkitfullscreenchange", updateButtonLabel as EventListener);
  window.addEventListener("keydown", handleKeydown);
  const unsubscribe = client.subscribe(() => {
    updateButtonLabel();
    updateGameSelectButton();
  });
  updateButtonLabel();
  updateGameSelectButton();

  return () => {
    targetDocument.removeEventListener("fullscreenchange", updateButtonLabel);
    targetDocument.removeEventListener("webkitfullscreenchange", updateButtonLabel as EventListener);
    window.removeEventListener("keydown", handleKeydown);
    unsubscribe();
    overlay.remove();
  };
}
