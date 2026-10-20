import { isLobbyFieldVisible, type AvailableGameDto, type RoomLanguage } from "@open-party-lab/protocol";
import { getHostText } from "../i18n/hostText.js";
import { renderGameGlyph, renderUiIcon } from "./gameGlyphs.js";
import { escapeHtml } from "./escapeHtml.js";

type LobbyField = NonNullable<AvailableGameDto["lobbySetup"]>["fields"][number];
type SettingsMap = Record<string, string | number | boolean>;

export interface CatalogOptions {
  games: readonly AvailableGameDto[];
  selectedGameId: string | null;
  settings: SettingsMap;
  language: RoomLanguage;
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

function renderTile(game: AvailableGameDto, language: RoomLanguage): string {
  const description = game.lobbySetup?.description ?? game.description;

  return `
    <button type="button" class="opl-tile" data-action="select-game" data-game-id="${escapeHtml(game.id)}" style="${tileVariables(game)}">
      <div class="opl-tile-art">
        <span class="opl-tile-badge">${renderGameGlyph(game.visual?.icon, game.visual?.iconPath, 38)}</span>
        <div class="opl-tile-art-text">
          <p class="opl-tile-eyebrow">${escapeHtml(game.visual?.eyebrow ?? getHostText(language).shellSetupKicker)}</p>
          <p class="opl-tile-name">${escapeHtml(game.displayName)}</p>
        </div>
      </div>
      <div class="opl-tile-body">
        ${description ? `<p class="opl-tile-desc">${escapeHtml(description)}</p>` : ""}
        <p class="opl-tile-meta"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${game.minPlayers}–${game.maxPlayers} ${escapeHtml(language === "de" ? "Spieler" : language === "ar" ? "لاعبين" : "players")}</p>
      </div>
    </button>
  `;
}

function renderSelectField(field: LobbyField & { kind: "select" }, value: unknown, locked: boolean, language: RoomLanguage): string {
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
  const rules = selected?.rules?.[language] ?? selected?.rules?.en ?? selected?.rules?.de;
  const rulesSummary =
    language === "ar" ? "إظهار القواعد" : language === "en" ? "Show rules" : "Regeln anzeigen";
  const help = rules?.length ? `<details class="opl-rules-preview"><summary>${rulesSummary}</summary>${rules.map((section) => `<section><h3>${escapeHtml(section.title)}</h3><ul>${section.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul></section>`).join("")}</details>` : "";
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

function renderSetup(game: AvailableGameDto, settings: SettingsMap, locked: boolean, language: RoomLanguage): string {
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
  language: RoomLanguage,
  locked: boolean
): string {
  return game ? renderOpenGameCard(game, settings, language, locked) : "";
}

function renderOpenGameCard(
  game: AvailableGameDto,
  settings: SettingsMap,
  language: RoomLanguage,
  locked: boolean
): string {
  const text = getHostText(language);
  const accent = game.visual?.accent ?? "#bd4727";
  const tint = `color-mix(in srgb, ${accent} 16%, transparent)`;
  const eyebrow = game.visual?.eyebrow ?? text.shellSetupKicker;
  const description = game.lobbySetup?.description ?? game.description;
  const rules = game.rules?.[language] ?? game.rules?.en ?? game.rules?.de;
  const rulesPreview = rules?.length
    ? `<details class="opl-rules-preview"><summary>${escapeHtml(text.shellRulesPreview)}</summary>${rules
        .map(
          (section) =>
            `<div><h3>${escapeHtml(section.title)}</h3><ul>${section.lines
              .map((line) => `<li>${escapeHtml(line)}</li>`)
              .join("")}</ul></div>`
        )
        .join("")}</details>`
    : "";

  return `
    <article class="opl-open-card opl-game-confirm-card" style="--tile-accent:${escapeHtml(accent)};--tile-tint:${escapeHtml(tint)}">
      <header class="opl-game-confirm-header">
        <div class="opl-game-confirm-badge">${renderGameGlyph(game.visual?.icon, game.visual?.iconPath, 42)}</div>
        <div class="opl-game-confirm-meta">
          <p class="opl-game-confirm-eyebrow">${escapeHtml(eyebrow)}</p>
          <h2 class="opl-game-confirm-title">${escapeHtml(game.displayName)}</h2>
          <p class="opl-game-confirm-players"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${game.minPlayers}–${game.maxPlayers} ${escapeHtml(language === "de" ? "Spieler" : language === "ar" ? "لاعبين" : "players")}</p>
        </div>
        <button type="button" class="opl-game-confirm-back" data-action="back" title="${escapeHtml(text.shellBack)}">
          ${renderUiIcon("back", 18)} <span>${escapeHtml(text.shellBack)}</span>
        </button>
      </header>
      <div class="opl-game-confirm-body">
        ${description ? `<p class="opl-game-confirm-desc">${escapeHtml(description)}</p>` : ""}
        ${rulesPreview}
        ${renderSetup(game, settings, locked, language)}
      </div>
      <footer class="opl-game-confirm-footer">
        <button type="button" class="opl-game-confirm-action" data-action="setup-confirm" data-action-type="select-game">
          ${escapeHtml(language === "de" ? "Dieses Spiel wählen" : language === "ar" ? "اختيار هذه اللعبة" : "Select this game")}
        </button>
      </footer>
    </article>
  `;
}

export function renderCatalog(options: CatalogOptions): string {
  return options.games.map((game) => renderTile(game, options.language)).join("");
}
