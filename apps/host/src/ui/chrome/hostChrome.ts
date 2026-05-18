import { elevation, layers, radius } from "@open-party-lab/ui-kit";
import { hostTheme } from "../theme/theme.js";

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

export const hostChrome = {
  zIndex: {
    hud: String(layers.hud),
    join: String(layers.join),
    debug: String(layers.debug),
    dock: String(layers.dock),
    controls: String(layers.controls)
  },
  offset: {
    edge: "18px",
    dockBottom: "16px"
  },
  surface: {
    glass: "rgba(15, 23, 42, 0.84)",
    glassStrong: "rgba(15, 23, 42, 0.94)",
    glassDeep: "rgba(8, 15, 30, 0.72)",
    paper: "rgba(248, 250, 252, 0.96)"
  },
  border: {
    subtle: "1px solid rgba(148, 163, 184, 0.18)",
    bright: "1px solid rgba(125, 211, 252, 0.28)",
    paper: "1px solid rgba(15, 23, 42, 0.12)"
  },
  shadow: {
    dock: elevation.dock,
    dockActive:
      "0 20px 48px rgba(14, 165, 233, 0.34), 0 0 0 5px rgba(14, 165, 233, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.42)",
    panel: elevation.panel,
    paper: elevation.paper
  },
  radius: {
    panel: `${radius.lg}px`,
    section: "16px",
    control: `${radius.md}px`,
    pill: `${radius.pill}px`
  }
} as const;

export function applyStyles(element: HTMLElement, styles: StyleMap): void {
  Object.assign(element.style, styles);
}

export function trapChromePointerEvents(element: HTMLElement): void {
  const stopAtOverlay = (event: Event): void => {
    event.stopPropagation();
  };

  for (const eventName of trappedPointerEvents) {
    element.addEventListener(eventName, stopAtOverlay);
  }
}

export function createChromeCard(tone: "dark" | "paper" = "dark"): HTMLDivElement {
  const card = document.createElement("div");
  trapChromePointerEvents(card);
  applyStyles(
    card,
    tone === "paper"
      ? {
          display: "grid",
          gap: "12px",
          padding: "16px",
          background: hostChrome.surface.paper,
          border: hostChrome.border.paper,
          borderRadius: hostChrome.radius.panel,
          boxShadow: hostChrome.shadow.paper,
          color: hostTheme.panel,
          fontFamily: hostTheme.bodyFont
        }
      : {
          display: "grid",
          gap: "12px",
          padding: "16px",
          background: hostChrome.surface.glassStrong,
          border: "1px solid rgba(148, 163, 184, 0.16)",
          borderRadius: hostChrome.radius.panel,
          boxShadow: hostChrome.shadow.panel,
          color: hostTheme.text,
          fontFamily: hostTheme.bodyFont,
          backdropFilter: "blur(12px)"
        }
  );
  return card;
}

export function createChromeSection(tone: "dark" | "paper" = "dark"): HTMLDivElement {
  const section = document.createElement("div");
  applyStyles(section, {
    borderRadius: hostChrome.radius.section,
    border: tone === "paper" ? hostChrome.border.paper : "1px solid rgba(148, 163, 184, 0.12)",
    background: tone === "paper" ? "#e2e8f0" : hostChrome.surface.glassDeep
  });
  return section;
}

export function createChromeTextButton(label: string, tone: "neutral" | "danger" = "neutral"): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  applyStyles(button, {
    padding: "8px 12px",
    borderRadius: hostChrome.radius.pill,
    border: tone === "danger" ? "1px solid rgba(248, 113, 113, 0.24)" : hostChrome.border.subtle,
    background: tone === "danger" ? "rgba(127, 29, 29, 0.78)" : "rgba(30, 41, 59, 0.96)",
    color: tone === "danger" ? "#fecaca" : hostTheme.text,
    fontFamily: hostTheme.bodyFont,
    fontSize: "13px",
    cursor: "pointer",
    touchAction: "manipulation"
  });
  return button;
}

export function createChromeIconButton(label: string, svgMarkup: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  applyStyles(button, {
    position: "relative",
    overflow: "hidden",
    isolation: "isolate",
    border: hostChrome.border.bright,
    borderRadius: hostChrome.radius.pill,
    width: "52px",
    height: "52px",
    padding: "0",
    background: "linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(8, 47, 73, 0.86))",
    color: hostTheme.text,
    fontFamily: hostTheme.bodyFont,
    cursor: "pointer",
    backdropFilter: "blur(14px)",
    boxShadow: hostChrome.shadow.dock,
    display: "grid",
    placeItems: "center",
    touchAction: "manipulation",
    transition:
      "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease, color 160ms ease, opacity 160ms ease",
    outline: "none"
  });
  button.dataset.borderColor = "rgba(125, 211, 252, 0.28)";
  button.dataset.boxShadow = hostChrome.shadow.dock;
  button.dataset.iconTransform = "rotate(0deg)";
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-expanded", "false");
  button.title = label;
  button.innerHTML = `
    <span aria-hidden="true" style="position: absolute; inset: 6px; z-index: -1; border-radius: 999px; background: radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.28), transparent 32%), radial-gradient(circle at 68% 72%, rgba(34, 211, 238, 0.2), transparent 42%);"></span>
    <span aria-hidden="true" style="position: absolute; inset: 1px; z-index: -1; border-radius: 999px; box-shadow: inset 0 -10px 18px rgba(2, 6, 23, 0.3);"></span>
    <span data-host-chrome-icon style="display: grid; place-items: center; transition: transform 180ms ease;">
      ${svgMarkup}
    </span>
  `;

  const setHover = (hovered: boolean): void => {
    if (button.disabled) {
      return;
    }

    const active = button.getAttribute("aria-expanded") === "true";
    button.style.transform = hovered ? "translateY(-2px) scale(1.03)" : "translateY(0) scale(1)";
    button.style.borderColor = hovered
      ? "rgba(186, 230, 253, 0.62)"
      : button.dataset.borderColor ?? "rgba(125, 211, 252, 0.28)";
    button.style.boxShadow = hovered
      ? "0 22px 50px rgba(2, 6, 23, 0.42), 0 0 0 4px rgba(14, 165, 233, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.18)"
      : button.dataset.boxShadow ?? hostChrome.shadow.dock;

    const icon = button.querySelector<HTMLElement>("[data-host-chrome-icon]");
    if (icon) {
      icon.style.transform = hovered
        ? active
          ? "rotate(58deg)"
          : "rotate(18deg)"
        : button.dataset.iconTransform ?? "rotate(0deg)";
    }
  };

  button.addEventListener("pointerenter", () => setHover(true));
  button.addEventListener("pointerleave", () => setHover(false));
  button.addEventListener("focus", () => setHover(true));
  button.addEventListener("blur", () => setHover(false));
  return button;
}

export function setChromeIconButtonState(
  button: HTMLButtonElement,
  options: { active?: boolean; disabled?: boolean; label?: string }
): void {
  const active = options.active === true;
  const disabled = options.disabled === true;
  const borderColor = active ? "rgba(224, 242, 254, 0.74)" : "rgba(125, 211, 252, 0.28)";
  const boxShadow = active ? hostChrome.shadow.dockActive : hostChrome.shadow.dock;
  const iconTransform = active ? "rotate(45deg)" : "rotate(0deg)";
  const icon = button.querySelector<HTMLElement>("[data-host-chrome-icon]");

  button.dataset.borderColor = borderColor;
  button.dataset.boxShadow = boxShadow;
  button.dataset.iconTransform = iconTransform;
  button.disabled = disabled;
  button.style.background = active
    ? "linear-gradient(145deg, rgba(125, 211, 252, 0.98), rgba(14, 165, 233, 0.92))"
    : "linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(8, 47, 73, 0.86))";
  button.style.borderColor = borderColor;
  button.style.boxShadow = boxShadow;
  button.style.color = active ? "#082f49" : hostTheme.text;
  button.style.cursor = disabled ? "default" : "pointer";
  button.style.opacity = disabled ? "0.45" : "1";
  button.style.transform = "translateY(0) scale(1)";
  button.setAttribute("aria-expanded", active ? "true" : "false");

  if (options.label) {
    button.title = options.label;
    button.setAttribute("aria-label", options.label);
  }

  if (icon) {
    icon.style.transform = iconTransform;
  }
}
