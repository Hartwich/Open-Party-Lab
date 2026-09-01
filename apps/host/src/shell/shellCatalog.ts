import type { AvailableGameDto, SupportedLanguage } from "@open-party-lab/protocol";
import { getHostText } from "../i18n/hostText.js";
import { renderGameGlyph, renderUiIcon } from "./gameGlyphs.js";
import { escapeHtml } from "./escapeHtml.js";

type LobbyField = NonNullable<AvailableGameDto["lobbySetup"]>["fields"][number];
type SettingsMap = Record<string, string | number | boolean>;

export interface CatalogOptions {
  games: readonly AvailableGameDto[];
  selectedGameId: string | null;
  settings: SettingsMap;
  language: SupportedLanguage;
  /** Selection and setup are frozen while a round is running. */
  locked: boolean;
}

/**
 * How many tiles are shown before the grid collapses into a "more" tile.
 *
 * The catalog scrolls, so this is not a hard limit — it exists so an open
 * setup card never pushes the rest of the shelf out of sight. Selecting the
 * "more" tile is not a mode: it simply raises the cap for this render.
 */
const COLLAPSED_TILE_LIMIT = 11;

let expanded = false;

export function setCatalogExpanded(value: boolean): void {
  expanded = value;
}

export function isCatalogExpanded(): boolean {
  return expanded;
}

/** A tinted plate and a matching stroke, both derived from the game's hue. */
function tileVariables(game: AvailableGameDto): string {
  const accent = game.visual?.accent ?? "var(--accent)";

  return (
    `--tile-accent:${escapeHtml(accent)};` +
    `--tile-tint:color-mix(in srgb, ${escapeHtml(accent)} 16%, var(--surface));`
  );
}

function renderTile(game: AvailableGameDto, language: SupportedLanguage): string {
  const eyebrow = game.visual?.eyebrow ?? "";

  return `
    <button type="button" class="opl-tile" style="${tileVariables(game)}"
            data-action="select-game" data-game-id="${escapeHtml(game.id)}"
            aria-label="${escapeHtml(game.displayName)}">
      <span class="opl-tile-art">${renderGameGlyph(game.visual?.icon, game.visual?.iconPath, 40)}</span>
      <span class="opl-tile-body">
        ${eyebrow ? `<span class="opl-tile-eyebrow">${escapeHtml(eyebrow)}</span>` : ""}
        <span class="opl-tile-name">${escapeHtml(game.displayName)}</span>
        <span class="opl-tile-meta">${renderUiIcon("users", 13)}${game.minPlayers}–${game.maxPlayers}</span>
      </span>
    </button>
  `;
}

function renderSelectField(field: LobbyField & { kind: "select" }, value: unknown, locked: boolean): string {
  const current = String(value);
  const options = field.options
    .map(
      (option) => `
        <button type="button" class="opl-option"
                aria-pressed="${option.id === current ? "true" : "false"}"
                ${locked ? "disabled" : ""}
                data-action="setup-select"
                data-action-key="${escapeHtml(field.actionKey ?? field.id)}"
                data-value="${escapeHtml(option.id)}"
                ${option.description ? `title="${escapeHtml(option.description)}"` : ""}>
          ${escapeHtml(option.label)}
        </button>`
    )
    .join("");

  return `
    <div class="opl-field">
      <p class="opl-field-label">${escapeHtml(field.label)}</p>
      <div class="opl-options">${options}</div>
      ${field.description ? `<p class="opl-field-hint">${escapeHtml(field.description)}</p>` : ""}
    </div>
  `;
}

function renderNumberField(field: LobbyField & { kind: "number" }, value: unknown, locked: boolean): string {
  const numeric = typeof value === "number" ? value : Number(value);
  const current = Number.isFinite(numeric) ? numeric : field.defaultValue;
  const actionKey = escapeHtml(field.actionKey ?? field.id);
  const stepButton = (delta: number, label: string, disabled: boolean): string => `
    <button type="button" ${disabled || locked ? "disabled" : ""}
            data-action="setup-number" data-action-key="${actionKey}"
            data-value="${current + delta}" aria-label="${escapeHtml(field.label)} ${label}">${label}</button>`;

  return `
    <div class="opl-field">
      <p class="opl-field-label">${escapeHtml(field.label)}</p>
      <div class="opl-stepper">
        ${stepButton(-field.step, "−", current - field.step < field.min)}
        <output>${current}</output>
        ${stepButton(field.step, "+", current + field.step > field.max)}
      </div>
      ${field.description ? `<p class="opl-field-hint">${escapeHtml(field.description)}</p>` : ""}
    </div>
  `;
}

function renderSetup(game: AvailableGameDto, settings: SettingsMap, locked: boolean): string {
  const setup = game.lobbySetup;

  if (!setup) {
    return "";
  }

  const fields = setup.fields
    .map((field) => {
      const value = settings[field.settingKey ?? field.id] ?? field.defaultValue;

      return field.kind === "select"
        ? renderSelectField(field, value, locked)
        : renderNumberField(field, value, locked);
    })
    .join("");

  const confirmation = setup.confirmation;
  const confirmed = confirmation ? settings[confirmation.settingKey] === true : false;
  const confirmButton = confirmation
    ? `<div class="opl-field">
         <div class="opl-options">
           <button type="button" class="opl-option" aria-pressed="${confirmed ? "true" : "false"}"
                   ${locked ? "disabled" : ""}
                   data-action="setup-confirm" data-action-type="${escapeHtml(confirmation.actionType)}">
             ${escapeHtml(confirmation.label ?? "OK")}
           </button>
         </div>
         ${confirmation.description ? `<p class="opl-field-hint">${escapeHtml(confirmation.description)}</p>` : ""}
       </div>`
    : "";

  return fields + confirmButton;
}

/**
 * The selected game, expanded into a settings card.
 *
 * It sits directly above the shelf rather than inside the grid. Placed as a
 * full-width grid item it had to fit a grid row, and a row sized for tiles cut
 * the settings off — a fight with track sizing that the layout does not need to
 * have. Outside the grid it simply takes the height it needs, and the shelf
 * stays visible underneath so switching games is still one click.
 */
export function renderOpenGame(
  game: AvailableGameDto | undefined,
  settings: SettingsMap,
  language: SupportedLanguage,
  locked: boolean
): string {
  return game ? renderOpenGameCard(game, settings, language, locked) : "";
}

function renderOpenGameCard(
  game: AvailableGameDto,
  settings: SettingsMap,
  language: SupportedLanguage,
  locked: boolean
): string {
  const text = getHostText(language);
  const description = game.lobbySetup?.description ?? game.description;

  return `
    <section class="opl-open-card" style="${tileVariables(game)}">
      <div class="opl-setup">
        <div class="opl-setup-head">
          <span class="opl-setup-badge">${renderGameGlyph(
            game.visual?.icon,
            game.visual?.iconPath,
            30
          )}</span>
          <div class="opl-setup-title">
            <p class="opl-tile-eyebrow">${escapeHtml(game.visual?.eyebrow ?? text.shellSetupKicker)}</p>
            <p class="opl-tile-name" style="font-size:19px;min-height:0">${escapeHtml(
              game.displayName
            )}</p>
            ${description ? `<p class="opl-setup-desc">${escapeHtml(description)}</p>` : ""}
          </div>
          <button type="button" class="opl-back" data-action="back">
            ${renderUiIcon("back", 15)}${escapeHtml(text.shellBackToCatalog)}
          </button>
        </div>
        ${renderSetup(game, settings, locked)}
      </div>
    </section>
  `;
}

export function renderCatalog(options: CatalogOptions): string {
  const { games, selectedGameId, language } = options;
  const text = getHostText(language);
  const rest = games.filter((game) => game.id !== selectedGameId);
  const capped = expanded || rest.length <= COLLAPSED_TILE_LIMIT;
  const shown = capped ? rest : rest.slice(0, COLLAPSED_TILE_LIMIT);
  const hidden = rest.length - shown.length;

  const moreTile =
    hidden > 0
      ? `<button type="button" class="opl-tile-more" data-action="expand-catalog">
           ${renderUiIcon("dots", 22)}<span>${escapeHtml(text.shellMoreGames(hidden))}</span>
         </button>`
      : "";

  return shown.map((game) => renderTile(game, language)).join("") + moreTile;
}
