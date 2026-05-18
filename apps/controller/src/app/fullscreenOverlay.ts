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
    border: "1px solid rgba(125, 211, 252, 0.28)",
    borderRadius: "999px",
    width: "52px",
    height: "52px",
    padding: "0",
    background: "linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(8, 47, 73, 0.86))",
    color: "#f8fafc",
    fontFamily: "\"Nunito Sans\", sans-serif",
    cursor: "pointer",
    backdropFilter: "blur(14px)",
    boxShadow: "0 18px 38px rgba(2, 6, 23, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
    display: "grid",
    placeItems: "center",
    touchAction: "manipulation",
    transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease, color 160ms ease",
    outline: "none"
  });
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = `
    <span aria-hidden="true" style="position: absolute; inset: 6px; z-index: -1; border-radius: 999px; background: radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.28), transparent 32%), radial-gradient(circle at 68% 72%, rgba(34, 211, 238, 0.2), transparent 42%);"></span>
    <span aria-hidden="true" style="position: absolute; inset: 1px; z-index: -1; border-radius: 999px; box-shadow: inset 0 -10px 18px rgba(2, 6, 23, 0.3);"></span>
    <span data-controller-fullscreen-icon style="display: grid; place-items: center; transition: transform 180ms ease;">
      ${fullscreenIcon}
    </span>
  `;

  const setHover = (hovered: boolean): void => {
    const active = button.getAttribute("aria-pressed") === "true";
    button.style.transform = hovered ? "translateY(-2px) scale(1.03)" : "translateY(0) scale(1)";
    button.style.borderColor = hovered
      ? "rgba(186, 230, 253, 0.62)"
      : active
        ? "rgba(224, 242, 254, 0.74)"
        : "rgba(125, 211, 252, 0.28)";
    button.style.boxShadow = hovered
      ? "0 22px 50px rgba(2, 6, 23, 0.42), 0 0 0 4px rgba(14, 165, 233, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.18)"
      : active
        ? "0 20px 48px rgba(14, 165, 233, 0.34), 0 0 0 5px rgba(14, 165, 233, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.42)"
        : "0 18px 38px rgba(2, 6, 23, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.12)";

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
  button.style.background = active
    ? "linear-gradient(145deg, rgba(125, 211, 252, 0.98), rgba(14, 165, 233, 0.92))"
    : "linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(8, 47, 73, 0.86))";
  button.style.borderColor = active ? "rgba(224, 242, 254, 0.74)" : "rgba(125, 211, 252, 0.28)";
  button.style.boxShadow = active
    ? "0 20px 48px rgba(14, 165, 233, 0.34), 0 0 0 5px rgba(14, 165, 233, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.42)"
    : "0 18px 38px rgba(2, 6, 23, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.12)";
  button.style.color = active ? "#082f49" : "#f8fafc";
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
