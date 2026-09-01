import { elevation, layers, radius } from "@open-party-lab/ui-kit";

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
    /** Default floating panel over game art. */
    glass: "var(--scrim-surface)",
    /** Opaque variant when readability matters more than depth. */
    glassStrong: "var(--surface)",
    /** Inset sections inside a panel. */
    glassDeep: "var(--scrim-surface-soft)",
    /** Legacy alias — same warm paper as everything else now. */
    paper: "var(--surface)",
    /** Full-screen dimmer behind modals. */
    backdrop: "var(--scrim-backdrop)"
  },
  border: {
    subtle: "1px solid var(--line)",
    bright: "1px solid color-mix(in srgb, var(--accent) 38%, transparent)",
    paper: "1px solid var(--line)"
  },
  shadow: {
    dock: elevation.dock,
    dockActive: elevation.dockActive,
    panel: elevation.panel,
    card: elevation.card,
    modal: elevation.modal,
    paper: elevation.card
  },
  radius: {
    panel: `${radius.lg}px`,
    section: `${radius.md}px`,
    control: `${radius.sm}px`,
    pill: `${radius.pill}px`
  },
  focusRing: "0 0 0 3px var(--accent-strong)"
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

/**
 * `tone` is kept for call-site compatibility. Both tones now render warm paper
 * cards; `paper` simply drops the blur so it stays crisp on static backdrops.
 */
export function createChromeCard(tone: "dark" | "paper" = "dark"): HTMLDivElement {
  const card = document.createElement("div");
  trapChromePointerEvents(card);
  applyStyles(card, {
    display: "grid",
    gap: "12px",
    padding: "16px",
    background: tone === "paper" ? hostChrome.surface.glassStrong : hostChrome.surface.glass,
    border: hostChrome.border.subtle,
    borderRadius: hostChrome.radius.panel,
    boxShadow: hostChrome.shadow.panel,
    color: "var(--ink)",
    fontFamily: "var(--font-body)",
    backdropFilter: tone === "paper" ? "none" : "blur(10px)"
  });
  return card;
}

export function createChromeSection(tone: "dark" | "paper" = "dark"): HTMLDivElement {
  const section = document.createElement("div");
  applyStyles(section, {
    borderRadius: hostChrome.radius.section,
    border: hostChrome.border.subtle,
    background: tone === "paper" ? "var(--surface-muted)" : hostChrome.surface.glassDeep
  });
  return section;
}

export function createChromeTextButton(
  label: string,
  tone: "neutral" | "danger" | "accent" = "neutral"
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;

  const toneStyles =
    tone === "danger"
      ? {
          border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
          background: "var(--danger-soft)",
          color: "var(--danger)"
        }
      : tone === "accent"
        ? {
            border: "1px solid var(--accent)",
            background: "var(--accent)",
            color: "var(--on-accent)"
          }
        : {
            border: hostChrome.border.subtle,
            background: "var(--surface)",
            color: "var(--ink)"
          };

  applyStyles(button, {
    ...toneStyles,
    padding: "8px 14px",
    borderRadius: hostChrome.radius.pill,
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    touchAction: "manipulation",
    transition: "background 140ms ease, border-color 140ms ease, color 140ms ease"
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
    border: hostChrome.border.subtle,
    borderRadius: hostChrome.radius.pill,
    width: "52px",
    height: "52px",
    padding: "0",
    background: "var(--surface)",
    color: "var(--ink)",
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    boxShadow: hostChrome.shadow.dock,
    display: "grid",
    placeItems: "center",
    touchAction: "manipulation",
    transition:
      "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease, color 160ms ease, opacity 160ms ease",
    outline: "none"
  });
  button.dataset.borderColor = "var(--line)";
  button.dataset.boxShadow = hostChrome.shadow.dock;
  button.dataset.iconTransform = "rotate(0deg)";
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-expanded", "false");
  button.title = label;
  button.innerHTML = `
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
      ? "color-mix(in srgb, var(--accent) 55%, transparent)"
      : button.dataset.borderColor ?? "var(--line)";
    button.style.boxShadow = hovered
      ? `${elevation.panel}, ${hostChrome.focusRing}`
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
  const borderColor = active ? "var(--accent-strong)" : "var(--line)";
  const boxShadow = active ? hostChrome.shadow.dockActive : hostChrome.shadow.dock;
  const iconTransform = active ? "rotate(45deg)" : "rotate(0deg)";
  const icon = button.querySelector<HTMLElement>("[data-host-chrome-icon]");

  button.dataset.borderColor = borderColor;
  button.dataset.boxShadow = boxShadow;
  button.dataset.iconTransform = iconTransform;
  button.disabled = disabled;
  button.style.background = active ? "var(--accent)" : "var(--surface)";
  button.style.borderColor = borderColor;
  button.style.boxShadow = boxShadow;
  button.style.color = active ? "var(--on-accent)" : "var(--ink)";
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
