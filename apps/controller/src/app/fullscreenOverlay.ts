import { getControllerText, readStoredControllerLanguage } from "../i18n/controllerText.js";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type StyleMap = Partial<CSSStyleDeclaration>;

const trappedPointerEvents = [
  "click",
  "dblclick",
  "contextmenu",
  "mousedown",
  "mousemove",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel",
  "touchstart",
  "touchmove",
  "touchend",
  "touchcancel",
  "wheel"
] as const;

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

function applyStyles(element: HTMLElement, styles: StyleMap): void {
  Object.assign(element.style, styles);
}

function trapOverlayPointerEvents(element: HTMLElement): void {
  const stopAtOverlay = (event: Event): void => {
    event.stopPropagation();
  };

  for (const eventName of trappedPointerEvents) {
    element.addEventListener(eventName, stopAtOverlay);
  }
}

function createFullscreenIconButton(): HTMLButtonElement {
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
  const button = document.createElement("button");
  button.type = "button";
  applyStyles(button, {
    position: "relative",
    overflow: "hidden",
    isolation: "isolate",
    border: "1px solid var(--line)",
    borderRadius: "999px",
    width: "52px",
    height: "52px",
    padding: "0",
    background: "var(--surface)",
    color: "var(--ink)",
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    boxShadow: "var(--shadow-card)",
    display: "grid",
    placeItems: "center",
    touchAction: "manipulation",
    transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease, color 160ms ease",
    outline: "none"
  });
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = `
    <span data-controller-fullscreen-icon style="display: grid; place-items: center; transition: transform 180ms ease;">
      ${fullscreenIcon}
    </span>
  `;

  const setHover = (hovered: boolean): void => {
    const active = button.getAttribute("aria-pressed") === "true";
    button.style.transform = hovered ? "translateY(-2px) scale(1.03)" : "translateY(0) scale(1)";
    button.style.borderColor = hovered || active ? "var(--accent)" : "var(--line)";
    button.style.boxShadow = hovered || active ? "var(--shadow-panel)" : "var(--shadow-card)";

    const icon = button.querySelector<HTMLElement>("[data-controller-fullscreen-icon]");
    if (icon) {
      icon.style.transform = hovered
        ? active ? "rotate(58deg)" : "rotate(18deg)"
        : active ? "rotate(45deg)" : "rotate(0deg)";
    }
  };

  button.addEventListener("pointerenter", () => setHover(true));
  button.addEventListener("pointerleave", () => setHover(false));
  button.addEventListener("focus", () => setHover(true));
  button.addEventListener("blur", () => setHover(false));
  return button;
}

function setFullscreenIconButtonState(button: HTMLButtonElement, active: boolean): void {
  const text = getControllerText(readStoredControllerLanguage());
  const label = active ? `${text.exitFullscreen} (F)` : `${text.fullscreen} (F)`;
  const icon = button.querySelector<HTMLElement>("[data-controller-fullscreen-icon]");

  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", active ? "true" : "false");
  button.title = active ? text.exitFullscreenHint : text.fullscreenHint;
  button.style.background = active ? "var(--accent)" : "var(--surface)";
  button.style.borderColor = active ? "var(--accent-strong)" : "var(--line)";
  button.style.boxShadow = active ? "var(--shadow-panel)" : "var(--shadow-card)";
  button.style.color = active ? "var(--on-accent)" : "var(--ink)";
  button.style.transform = "translateY(0) scale(1)";

  if (icon) {
    icon.style.transform = active ? "rotate(45deg)" : "rotate(0deg)";
  }
}

export function mountControllerFullscreenOverlay(): () => void {
  const targetDocument = document as FullscreenDocument;
  const overlay = document.createElement("div");
  trapOverlayPointerEvents(overlay);
  applyStyles(overlay, {
    position: "fixed",
    right: "14px",
    top: "14px",
    zIndex: "60",
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px"
  });

  const fullscreenButton = createFullscreenIconButton();
  overlay.appendChild(fullscreenButton);
  document.body.appendChild(overlay);

  function updateButtonLabel(): void {
    const active = isFullscreenActive(targetDocument);
    setFullscreenIconButtonState(fullscreenButton, active);
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

    if (isFormField || event.key.toLowerCase() !== "f") {
      return;
    }

    event.preventDefault();
    void toggleFullscreen();
  }

  fullscreenButton.addEventListener("click", (event) => {
    (event.currentTarget as HTMLButtonElement).blur();
    void toggleFullscreen();
  });
  targetDocument.addEventListener("fullscreenchange", updateButtonLabel);
  targetDocument.addEventListener("webkitfullscreenchange", updateButtonLabel as EventListener);
  window.addEventListener("keydown", handleKeydown);
  updateButtonLabel();

  return () => {
    targetDocument.removeEventListener("fullscreenchange", updateButtonLabel);
    targetDocument.removeEventListener("webkitfullscreenchange", updateButtonLabel as EventListener);
    window.removeEventListener("keydown", handleKeydown);
    overlay.remove();
  };
}
