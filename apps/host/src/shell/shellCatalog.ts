import { isLobbyFieldVisible, type AvailableGameDto, type SupportedLanguage } from "@open-party-lab/protocol";
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

/*
 * The shelf shows every game, always.
 *
 * It used to cap at eleven tiles and hide the rest behind a "more" tile, on the
 * assumption that an open setup card had to share the screen with the shelf.
 * Selecting a game now replaces the shelf entirely, so there is nothing left to
 * make room for — and a catalog that hides half its contents is a worse way to
 * choose than a grid that scrolls.
 */

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

function renderSelectField(field: LobbyField & { kind: "select" }, value: unknown, locked: boolean, language: SupportedLanguage): string {
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

  const selected = field.options.find((option) => option.id === current);
  const rules = selected?.rules?.[language] ?? selected?.rules?.de;
  const help = rules?.length ? `<details class="opl-rules-preview"><summary>${language === "en" ? "Show rules" : "Regeln anzeigen"}</summary>${rules.map((section) => `<section><h3>${escapeHtml(section.title)}</h3><ul>${section.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul></section>`).join("")}</details>` : "";
  return `
    <div class="opl-field">
      <p class="opl-field-label">${escapeHtml(field.label)}</p>
      <div class="opl-options">${options}</div>
      ${selected?.description ? `<p class="opl-field-hint">${escapeHtml(selected.description)}</p>` : ""}
      ${help}
      ${field.description ? `<p class="opl-field-hint">${escapeHtml(field.description)}</p>` : ""}
    </div>
  `;
}

/**
 * Ein Häkchen statt zweier Knöpfe.
 *
 * Der Klick schickt jeweils den anderen Wert - damit bleibt die bestehende
 * `setup-select`-Behandlung unverändert, und der Schalter ist nur eine andere
 * Darstellung derselben Auswahl.
 */
function renderToggleField(field: LobbyField & { kind: "toggle" }, value: unknown, locked: boolean): string {
  const on = String(value) === field.onValue;
  const nextValue = on ? field.offValue : field.onValue;

  return `
    <button type="button" class="opl-toggle" aria-pressed="${on ? "true" : "false"}"
            ${locked ? "disabled" : ""}
            data-action="setup-select"
            data-action-key="${escapeHtml(field.actionKey ?? field.id)}"
            data-value="${escapeHtml(nextValue)}"
            ${field.description ? `title="${escapeHtml(field.description)}"` : ""}>
      <span class="opl-toggle-box" aria-hidden="true">✓</span>
      <span class="opl-toggle-text">${escapeHtml(field.label)}</span>
    </button>
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

function renderSetup(game: AvailableGameDto, settings: SettingsMap, locked: boolean, language: SupportedLanguage): string {
  const setup = game.lobbySetup;

  if (!setup) {
    return "";
  }

  const visible = setup.fields
    // Optionen, die für das gewählte Regelwerk nichts bewirken, werden nicht
    // ausgegraut, sondern gar nicht erst gezeigt.
    .filter((field) => isLobbyFieldVisible(field, setup.fields, settings));

  const renderField = (field: LobbyField): string => {
    const value = settings[field.settingKey ?? field.id] ?? field.defaultValue;

    if (field.kind === "select") {
      return renderSelectField(field, value, locked, language);
    }

    return field.kind === "toggle"
      ? renderToggleField(field, value, locked)
      : renderNumberField(field, value, locked);
  };

  // Felder mit derselben Gruppe erscheinen zusammen unter einer Überschrift,
  // in der Reihenfolge, in der die Gruppe zuerst auftaucht.
  type Block = { title: string | null; html: string[] };
  const blocks: Block[] = [];

  for (const field of visible) {
    const title = field.group ?? null;
    const last = blocks[blocks.length - 1];
    const target =
      title !== null ? blocks.find((block) => block.title === title) : last?.title === null ? last : undefined;

    if (target) {
      target.html.push(renderField(field));
      continue;
    }

    blocks.push({ title, html: [renderField(field)] });
  }

  const fields = blocks
    .map((block) =>
      block.title === null
        ? block.html.join("")
        : `
        <div class="opl-group">
          <p class="opl-group-title">${escapeHtml(block.title)}</p>
          <div class="opl-group-body">${block.html.join("")}</div>
        </div>
      `
    )
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
        ${renderSetup(game, settings, locked, language)}
      </div>
    </section>
  `;
}

export function renderCatalog(options: CatalogOptions): string {
  return options.games.map((game) => renderTile(game, options.language)).join("");
}
