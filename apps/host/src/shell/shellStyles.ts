/**
 * The shell's stylesheet.
 *
 * Lobby and catalog live in the DOM rather than on the Phaser canvas. That is
 * not a cosmetic preference: the canvas is a fixed-size bitmap the browser
 * rescales to the screen, so everything drawn into it — text above all — arrives
 * softened. The same markup rendered by the browser is resolution-independent
 * and stays crisp at any display density.
 *
 * Colours come exclusively from the theme's custom properties, so a theme
 * switch is a variable update on the root element and never a re-render.
 */
const STYLE_ELEMENT_ID = "opl-shell-styles";

const css = `
.opl-shell {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  font-family: var(--font-body);
  color: var(--ink);
  background:
    radial-gradient(120% 90% at 12% -10%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 60%),
    radial-gradient(100% 80% at 100% 110%, color-mix(in srgb, var(--amber) 12%, transparent), transparent 62%),
    var(--paper);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  overflow: hidden;
  z-index: 30;
}

.opl-shell[hidden] { display: none; }

.opl-shell *,
.opl-shell *::before,
.opl-shell *::after { box-sizing: border-box; }

/*
 * The button reset is wrapped in :where() so it carries no specificity of its
 * own. Written as a plain descendant selector it outranks every single-class
 * component rule below and silently strips their background, border and shadow
 * — which is exactly what it did until a screenshot showed the tiles had no
 * card edges at all.
 */
.opl-shell :where(button) {
  font: inherit;
  color: inherit;
  cursor: pointer;
  border: none;
  background: none;
  touch-action: manipulation;
}

.opl-shell :focus-visible {
  outline: 3px solid var(--accent-strong);
  outline-offset: 2px;
  box-shadow: none;
}

/* ---------- left dock ---------- */

.opl-dock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 76px;
  padding: 20px 0;
  background: var(--surface);
  border-right: 1px solid var(--line);
}

.opl-brand {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: var(--accent);
  color: var(--on-accent);
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.5px;
}

.opl-dock-rule {
  width: 26px;
  height: 1px;
  background: var(--line);
  margin: 4px 0;
}

.opl-dock-spacer { flex: 1; }

.opl-dock-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  color: var(--muted);
  transition: background 150ms ease, color 150ms ease, transform 150ms ease;
}

.opl-dock-button:hover {
  background: var(--surface-muted);
  color: var(--ink);
  transform: translateY(-1px);
}

.opl-dock-button[aria-pressed="true"] {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

/* ---------- centre column ---------- */

.opl-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 26px 30px 24px;
  overflow: hidden;
}

.opl-kicker {
  margin: 0;
  font-size: 11px;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--muted) 76%, var(--amber));
}

.opl-title {
  margin: 2px 0 18px;
  font-family: var(--font-display);
  font-size: clamp(24px, 2.4vw, 38px);
  font-weight: 400;
  line-height: 1.15;
}

/* The scroll container. The settings card and the shelf are siblings inside it
   so neither can constrain the other's height. */
.opl-board {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 4px 8px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--line-strong) transparent;
}

.opl-board::-webkit-scrollbar { width: 8px; }
.opl-board::-webkit-scrollbar-thumb {
  background: var(--line-strong);
  border-radius: 99px;
}

.opl-catalog {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 14px;
  align-content: start;
}

/* ---------- game tile ---------- */

.opl-tile {
  display: flex;
  flex-direction: column;
  text-align: left;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.opl-tile:hover:not(.is-open) {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--tile-accent, var(--accent)) 55%, var(--line));
  box-shadow: var(--shadow-panel);
}

.opl-tile-art {
  display: grid;
  place-items: center;
  height: 92px;
  background: var(--tile-tint, var(--accent-soft));
  color: var(--tile-accent, var(--accent-strong));
  border-bottom: 1px solid color-mix(in srgb, var(--tile-accent, var(--accent)) 20%, transparent);
}

.opl-glyph-img { display: block; }

.opl-tile-body {
  display: block;
  padding: 10px 12px 12px;
}

.opl-tile-eyebrow {
  display: block;
  margin: 0;
  font-size: 10px;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--tile-accent, var(--muted)) 45%, var(--ink));
}

.opl-tile-name {
  display: block;
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.25;
  /* Two lines' worth, so a wrapping title does not make the row ragged. */
  min-height: 2.5em;
}

.opl-tile-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.opl-tile-meta svg { flex: none; }

.opl-tile-more {
  display: grid;
  place-items: center;
  gap: 6px;
  min-height: 150px;
  color: var(--muted);
  font-size: 12px;
  background: var(--surface-muted);
  border: 1px dashed var(--line-strong);
  border-radius: 16px;
}

/* ---------- the setup card ---------- */

/*
 * The settings card for the selected game.
 *
 * It borrows the tile's look but not its structure: no art band — a full-width
 * strip of colour above a form is a lot of empty colour — so the glyph shrinks
 * to a badge beside the title and the space goes to the controls.
 */
.opl-open-card {
  flex: none;
  background: var(--surface);
  border: 1px solid var(--tile-accent, var(--accent));
  border-radius: 16px;
  box-shadow: var(--shadow-panel);
}

.opl-setup {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.opl-setup-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.opl-setup-badge {
  display: grid;
  place-items: center;
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: 15px;
  background: var(--tile-tint, var(--accent-soft));
  color: var(--tile-accent, var(--accent-strong));
}

.opl-setup-title { flex: 1; min-width: 0; }

.opl-setup-desc {
  margin: 6px 0 0;
  max-width: 62ch;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink-soft);
}

.opl-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 7px 13px 7px 9px;
  font-size: 13px;
  color: var(--ink-soft);
  background: var(--surface-muted);
  border: 1px solid var(--line);
  border-radius: 99px;
  transition: background 140ms ease, color 140ms ease;
}

.opl-back:hover {
  background: var(--paper-deep);
  color: var(--ink);
}

/* justify-items keeps the stepper at its natural width instead of letting the
   grid stretch it across the whole card. */
.opl-field {
  display: grid;
  gap: 7px;
  justify-items: start;
}

.opl-field-label {
  margin: 0;
  font-size: 11px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--muted);
}

.opl-field-hint {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.opl-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.opl-option {
  padding: 9px 15px;
  font-size: 13px;
  background: var(--surface-muted);
  border: 1px solid var(--line);
  border-radius: 11px;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}

.opl-option:hover:not(:disabled) {
  border-color: var(--line-strong);
  background: var(--paper-deep);
}

.opl-option[aria-pressed="true"] {
  background: var(--tile-accent, var(--accent));
  border-color: var(--tile-accent, var(--accent));
  color: var(--on-accent);
}

.opl-option:disabled { opacity: 0.45; cursor: default; }

.opl-stepper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--surface-muted);
  border: 1px solid var(--line);
  border-radius: 11px;
}

.opl-stepper button {
  width: 34px;
  height: 32px;
  font-size: 17px;
  line-height: 1;
  border-radius: 8px;
  color: var(--ink-soft);
  transition: background 140ms ease;
}

.opl-stepper button:hover:not(:disabled) { background: var(--paper-deep); }
.opl-stepper button:disabled { opacity: 0.4; cursor: default; }

.opl-stepper output {
  min-width: 52px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 15px;
}

/* ---------- right rail ---------- */

.opl-rail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 268px;
  padding: 20px 18px;
  background: var(--surface);
  border-left: 1px solid var(--line);
}

.opl-room-card {
  padding: 14px 14px 16px;
  text-align: center;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
}

.opl-room-label {
  margin: 0 0 6px;
  font-size: 10px;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--muted) 76%, var(--amber));
}

.opl-room-code {
  margin: 0 0 12px;
  font-family: var(--font-mono);
  font-size: 40px;
  line-height: 1;
  letter-spacing: 7px;
  text-indent: 7px;
  color: var(--accent);
}

/* The code keeps its own light plate in both themes so it stays scannable. */
.opl-qr {
  display: block;
  width: 132px;
  height: 132px;
  margin: 0 auto;
  padding: 5px;
  background: #fffdf9;
  border-radius: 10px;
  image-rendering: pixelated;
}

.opl-room-url {
  margin: 10px 0 0;
  font-size: 11px;
  word-break: break-all;
  color: var(--muted);
}

.opl-rail-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2px 2px 0;
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--muted) 76%, var(--amber));
}

.opl-roster {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--line-strong) transparent;
}

.opl-roster-empty {
  padding: 14px 10px;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  color: var(--muted);
  background: var(--surface-muted);
  border: 1px dashed var(--line);
  border-radius: 12px;
}

.opl-player {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 7px;
  border-radius: 11px;
  transition: background 140ms ease;
}

.opl-player:hover { background: var(--surface-muted); }

.opl-avatar {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 500;
  color: var(--on-accent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--shadow-color) 18%, transparent);
}

.opl-player.is-offline .opl-avatar { opacity: 0.4; }

.opl-player-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.opl-player.is-offline .opl-player-name { color: var(--muted); }

.opl-badge {
  display: grid;
  place-items: center;
  flex: none;
  width: 22px;
  height: 22px;
}

.opl-badge-ready { color: var(--sage); }
.opl-badge-crown { color: var(--amber); }
.opl-badge-phone { color: var(--muted); }

.opl-kick {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: var(--danger);
  opacity: 0;
  transition: opacity 140ms ease, background 140ms ease;
}

.opl-player:hover .opl-kick,
.opl-kick:focus-visible { opacity: 1; }

.opl-kick:hover { background: var(--danger-soft); }

/* ---------- primary action ---------- */

.opl-start {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  font-size: 15px;
  font-weight: 500;
  color: var(--on-accent);
  background: var(--accent);
  border-radius: 13px;
  box-shadow: var(--shadow-card);
  transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
}

.opl-start:hover:not(:disabled) {
  background: var(--accent-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-panel);
}

.opl-start:active:not(:disabled) { transform: translateY(0); }

.opl-start:disabled {
  color: var(--muted);
  background: var(--surface-muted);
  border: 1px solid var(--line);
  box-shadow: none;
  cursor: default;
}

.opl-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  color: var(--muted);
}

.opl-note.is-error { color: var(--danger); }

/* ---------- narrow screens ---------- */

@media (max-width: 900px) {
  .opl-shell { grid-template-columns: auto minmax(0, 1fr); }
  .opl-rail {
    position: absolute;
    inset: 0 0 auto auto;
    height: 100%;
    box-shadow: var(--shadow-modal);
  }
}

@media (max-width: 640px) {
  .opl-rail { width: 220px; }
  .opl-main { padding: 18px 16px; }
}
`;

/** Injects the stylesheet once per document. */
export function installShellStyles(): void {
  if (document.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = css;
  document.head.appendChild(style);
}
