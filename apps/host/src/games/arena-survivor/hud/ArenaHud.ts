import type { ArenaSurvivorPlayerState, ArenaSurvivorState, RoomSnapshot } from "@open-party-lab/protocol";
import { hostTheme } from "../../../ui/theme/theme.js";

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRoundedHp(value: number): string {
  return `${Math.max(0, Math.round(value))}`;
}

function formatPercent(value: number): string {
  const safeValue = Math.max(0, value);
  return `${safeValue >= 10 ? Math.round(safeValue) : Math.round(safeValue * 10) / 10}%`;
}

function formatPlayerStats(player: ArenaSurvivorPlayerState): string {
  const stats = player.stats;

  return [
    `Atk ${Math.round(stats.attackSpeedMultiplier * 100)}%`,
    `HP ${formatRoundedHp(stats.maxHp)}`,
    `Dmg ${Math.round(stats.projectileDamageMultiplier * 100)}%`,
    `LS ${formatPercent(stats.lifeStealPct)}`,
    `Regen ${Math.round(stats.hpRegen * 10) / 10}`,
    `Armor ${Math.round(stats.armor * 10) / 10}`
  ].join("  |  ");
}

const cornerAnchors = [
  { horizontal: "left", vertical: "top" },
  { horizontal: "right", vertical: "top" },
  { horizontal: "left", vertical: "bottom" },
  { horizontal: "right", vertical: "bottom" }
] as const;

const topInset = "18px";
const sideInset = "18px";
const bottomInset = "18px";

function applyPanelChrome(element: HTMLElement): void {
  element.style.borderRadius = "18px";
  element.style.background = "rgba(15, 23, 42, 0.84)";
  element.style.border = "1px solid rgba(148, 163, 184, 0.22)";
  element.style.boxShadow = "0 14px 28px rgba(2, 6, 23, 0.28)";
  element.style.backdropFilter = "blur(10px)";
  element.style.pointerEvents = "none";
}

export interface ArenaHud {
  update(state: ArenaSurvivorState | null, room?: RoomSnapshot | null): void;
  destroy(): void;
}

export function createArenaHud(): ArenaHud {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "46";
  overlay.style.pointerEvents = "none";
  overlay.style.fontFamily = `"${hostTheme.bodyFont}", sans-serif`;
  overlay.style.color = hostTheme.text;

  const metaBar = document.createElement("div");
  metaBar.style.position = "absolute";
  metaBar.style.left = "50%";
  metaBar.style.top = "14px";
  metaBar.style.transform = "translateX(-50%)";
  metaBar.style.padding = "7px 12px";
  metaBar.style.fontSize = "13px";
  metaBar.style.fontWeight = "800";
  metaBar.style.letterSpacing = "0.01em";
  metaBar.style.whiteSpace = "nowrap";
  applyPanelChrome(metaBar);

  const playerCards = cornerAnchors.map((anchor) => {
    const card = document.createElement("section");
    card.style.position = "absolute";
    card.style.width = "min(132px, calc(50vw - 28px))";
    card.style.padding = "10px 12px 12px";
    card.style.display = "grid";
    card.style.gap = "5px";
    card.style.visibility = "hidden";
    applyPanelChrome(card);

    if (anchor.horizontal === "left") {
      card.style.left = sideInset;
    } else {
      card.style.right = sideInset;
    }

    if (anchor.vertical === "top") {
      card.style.top = topInset;
    } else {
      card.style.bottom = bottomInset;
    }

    const titleRow = document.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.justifyContent = "space-between";
    titleRow.style.alignItems = "center";
    titleRow.style.gap = "6px";

    const title = document.createElement("div");
    title.style.fontSize = "13px";
    title.style.fontWeight = "900";
    title.style.lineHeight = "1.2";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    title.style.whiteSpace = "nowrap";

    const materialBadge = document.createElement("div");
    materialBadge.style.fontSize = "10px";
    materialBadge.style.fontWeight = "800";
    materialBadge.style.color = "#e2e8f0";
    materialBadge.style.padding = "2px 7px";
    materialBadge.style.borderRadius = "999px";
    materialBadge.style.background = "rgba(30, 41, 59, 0.88)";
    materialBadge.style.border = "1px solid rgba(148, 163, 184, 0.16)";
    materialBadge.style.flexShrink = "0";

    titleRow.appendChild(title);
    titleRow.appendChild(materialBadge);

    const subline = document.createElement("div");
    subline.style.fontSize = "10px";
    subline.style.color = "#cbd5e1";
    subline.style.lineHeight = "1.35";

    const hpRow = document.createElement("div");
    hpRow.style.display = "grid";

    const hpLabel = document.createElement("div");
    hpLabel.style.position = "absolute";
    hpLabel.style.inset = "0";
    hpLabel.style.display = "flex";
    hpLabel.style.alignItems = "center";
    hpLabel.style.justifyContent = "center";
    hpLabel.style.fontSize = "10px";
    hpLabel.style.fontWeight = "800";
    hpLabel.style.color = "#e2e8f0";
    hpLabel.style.textShadow = "0 1px 2px rgba(2, 6, 23, 0.85)";

    const hpTrack = document.createElement("div");
    hpTrack.style.position = "relative";
    hpTrack.style.height = "12px";
    hpTrack.style.borderRadius = "999px";
    hpTrack.style.background = "#1e293b";
    hpTrack.style.overflow = "hidden";

    const hpFill = document.createElement("div");
    hpFill.style.height = "100%";
    hpFill.style.width = "0%";
    hpFill.style.borderRadius = "999px";
    hpFill.style.background = "#22c55e";
    hpFill.style.transition = "width 120ms linear";
    hpTrack.appendChild(hpFill);
    hpTrack.appendChild(hpLabel);

    hpRow.appendChild(hpTrack);

    card.appendChild(titleRow);
    card.appendChild(subline);
    card.appendChild(hpRow);

    overlay.appendChild(card);

    return {
      card,
      title,
      materialBadge,
      subline,
      hpLabel,
      hpFill
    };
  });

  const summaryCard = document.createElement("section");
  summaryCard.style.position = "absolute";
  summaryCard.style.left = "50%";
  summaryCard.style.top = "50%";
  summaryCard.style.transform = "translate(-50%, -50%)";
  summaryCard.style.width = "min(860px, calc(100vw - 56px))";
  summaryCard.style.maxHeight = "min(72vh, 680px)";
  summaryCard.style.overflow = "auto";
  summaryCard.style.padding = "24px 26px";
  summaryCard.style.display = "none";
  summaryCard.style.gridTemplateColumns = "1fr";
  summaryCard.style.gap = "16px";
  applyPanelChrome(summaryCard);
  summaryCard.style.background = "rgba(2, 6, 23, 0.9)";
  summaryCard.style.zIndex = "48";

  const summaryTitle = document.createElement("div");
  summaryTitle.style.fontSize = "24px";
  summaryTitle.style.fontWeight = "900";
  summaryTitle.style.textAlign = "center";

  const summaryBody = document.createElement("div");
  summaryBody.style.display = "grid";
  summaryBody.style.gap = "12px";

  summaryCard.appendChild(summaryTitle);
  summaryCard.appendChild(summaryBody);

  overlay.appendChild(metaBar);
  overlay.appendChild(summaryCard);
  document.body.appendChild(overlay);

  function update(state: ArenaSurvivorState | null, room: RoomSnapshot | null = null): void {
    const en = room?.language === "en";
    const readyCount = (room?.players ?? []).filter((player) => player.isReady).length;
    const playerCount = room?.players.length ?? state?.players.length ?? 0;
    const timeLabel =
      state?.result.outcome === "running"
        ? `${en ? "Time" : "Zeit"} ${formatTime(state.remainingMs)}`
        : `${en ? "Survived" : "Ueberlebt"} ${formatTime(state?.elapsedMs ?? 0)}`;
    const runningRound = state?.result.outcome === "running";

    metaBar.textContent = state
      ? runningRound
        ? `${timeLabel}   |   ${en ? "Wave" : "Welle"} ${state.waveNumber}   |   ${en ? "Enemies" : "Gegner"} ${state.enemies.length}`
        : `${timeLabel}   |   ${en ? "Wave" : "Welle"} ${state.waveNumber}   |   ${en ? "Ready" : "Bereit"} ${readyCount}/${playerCount}`
      : "Arena Survivor";

    for (let index = 0; index < playerCards.length; index += 1) {
      const card = playerCards[index];
      const player = state?.players[index];

      if (!player) {
        card.card.style.visibility = "hidden";
        continue;
      }

      const hpRatio = player.maxHp > 0 ? Math.max(0, Math.min(1, player.hp / player.maxHp)) : 0;
      const borderColor = player.color;
      const hpColor = hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#f59e0b" : "#ef4444";

      card.card.style.visibility = "visible";
      card.card.style.borderColor = borderColor;
      card.title.textContent = player.name;
      card.title.title = `${player.name} (${player.character.name})`;
      card.materialBadge.textContent = `M ${player.materials}`;
      card.subline.textContent = player.alive ? "" : "KO";
      card.subline.style.display = player.alive ? "none" : "block";
      card.hpLabel.textContent = `HP ${formatRoundedHp(player.hp)} / ${formatRoundedHp(player.maxHp)}`;
      card.hpFill.style.width = `${Math.round(hpRatio * 100)}%`;
      card.hpFill.style.background = hpColor;
    }

    const showSummary = Boolean(state && state.result.outcome !== "running");
    summaryCard.style.display = showSummary ? "grid" : "none";

    if (!showSummary || !state) {
      summaryTitle.textContent = "";
      summaryBody.replaceChildren();
      return;
    }

    summaryTitle.textContent = state.result.title;
    summaryBody.replaceChildren(
      ...state.players.map((player) => {
        const card = document.createElement("article");
        card.style.display = "grid";
        card.style.gap = "6px";
        card.style.padding = "14px 16px";
        card.style.borderRadius = "16px";
        card.style.background = "rgba(15, 23, 42, 0.8)";
        card.style.border = `1px solid ${player.color}`;

        const title = document.createElement("div");
        title.style.fontSize = "16px";
        title.style.fontWeight = "900";
        title.textContent = `${player.name}  |  ${player.character.name}  |  M ${player.materials}`;

        const weaponLine = document.createElement("div");
        weaponLine.style.fontSize = "13px";
        weaponLine.style.color = "#cbd5e1";
        weaponLine.textContent =
          player.loadout.weapons.length > 0
            ? player.loadout.weapons
              .map((weapon, index) => `W${index + 1}: ${weapon.displayName} Lv.${weapon.level}`)
              .join("  |  ")
            : en ? "No weapons" : "Keine Waffen";

        const statsLine = document.createElement("div");
        statsLine.style.fontSize = "13px";
        statsLine.style.color = "#e2e8f0";
        statsLine.textContent = formatPlayerStats(player);

        const itemsLine = document.createElement("div");
        itemsLine.style.fontSize = "12px";
        itemsLine.style.color = "#94a3b8";
        itemsLine.textContent =
          player.loadout.items.length > 0
            ? player.loadout.items.map((item) => `${item.displayName} Lv.${item.level}`).join("  |  ")
            : en ? "No items" : "Keine Items";

        card.appendChild(title);
        card.appendChild(weaponLine);
        card.appendChild(statsLine);
        card.appendChild(itemsLine);
        return card;
      })
    );
  }

  function destroy(): void {
    overlay.remove();
  }

  return { update, destroy };
}
