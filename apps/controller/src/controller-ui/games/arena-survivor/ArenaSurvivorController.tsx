import type { ArenaSurvivorPlayerState, ArenaSurvivorShopOfferState, ArenaSurvivorState } from "@open-party-lab/protocol";
import type { ControllerGameRenderContext } from "../registry.js";
import type { LayoutStat, ShopLayoutModel, ShopOfferModel, VirtualJoystickLayoutModel } from "../../layouts/models.js";
import {
  createArenaSurvivorMoveInput,
  createArenaSurvivorShopInput,
  createArenaSurvivorShopCombineInput,
  createArenaSurvivorShopRerollInput,
  createArenaSurvivorShopSellInput
} from "./arenaSurvivorBindings.js";

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRoundedHp(value: number | null | undefined): string {
  return `${Math.max(0, Math.round(value ?? 0))}`;
}

function formatPercent(value: number | null | undefined): string {
  const safeValue = Math.max(0, value ?? 0);
  return `${safeValue >= 10 ? Math.round(safeValue) : Math.round(safeValue * 10) / 10}%`;
}

function buildWeaponOfferStats(offer: ArenaSurvivorShopOfferState): LayoutStat[] {
  if (!offer.detailLines?.length) {
    return [];
  }

  return offer.detailLines.map((detailLine, index) => ({
    label: detailLine.label,
    value: detailLine.value,
    highlighted: index === 0 || detailLine.label === "Crit" || detailLine.label === "Projektile"
  }));
}

function enrichArenaSurvivorShopOffers(
  offers: ArenaSurvivorShopOfferState[]
): ShopOfferModel[] {
  return offers.map((offer) => {
    if (offer.kind !== "weapon") {
      return offer;
    }

    const stats = buildWeaponOfferStats(offer);

    return stats.length > 0 ? { ...offer, stats } : offer;
  });
}

function buildLoadoutWeaponStats(
  detailLines: ArenaSurvivorPlayerState["loadout"]["weapons"][number]["detailLines"]
): LayoutStat[] {
  return (
    detailLines?.map((detailLine, index) => ({
      label: detailLine.label,
      value: detailLine.value,
      highlighted: index === 0 || detailLine.label === "Crit" || detailLine.label === "Projektile"
    })) ?? []
  );
}

function resolveCurrentPlayer(
  context: ControllerGameRenderContext,
  state: ArenaSurvivorState | null
): ArenaSurvivorPlayerState | null {
  const playerId = context.state.player?.id;

  if (!playerId || !state) {
    return null;
  }

  return state.players.find((player) => player.playerId === playerId) ?? null;
}

function formatStatus(player: ArenaSurvivorPlayerState | null, state: ArenaSurvivorState | null, en: boolean): string {
  if (!player || !state) {
    return en ? "Waiting" : "Wartet";
  }

  if (state.result.outcome === "survived") {
    return en ? "Won" : "Gewonnen";
  }

  if (state.result.outcome === "defeated") {
    return en ? "Lost" : "Verloren";
  }

  if (!player.alive) {
    return en ? "Out" : "Ausgeschieden";
  }

  return en ? "Active" : "Aktiv";
}

function resolvePlayerStats(player: ArenaSurvivorPlayerState | null): Array<{ label: string; value: string }> {
  if (!player) {
    return [];
  }

  const stats = player.stats;

  return [
    { label: "Move Speed", value: `${Math.round(stats.moveSpeed)}` },
    { label: "Max HP", value: formatRoundedHp(stats.maxHp) },
    { label: "Proj Dmg", value: `${Math.round(stats.projectileDamageMultiplier * 100)}%` },
    { label: "Fire Rate", value: `${Math.round(stats.autoFireRateMultiplier * 100)}%` },
    { label: "Armor", value: `${Math.round((stats.armor ?? 0) * 100) / 100}` },
    { label: "Crit", value: `${Math.round(stats.critChancePct ?? 0)}%` },
    { label: "Atk Spd", value: `${Math.round((stats.attackSpeedMultiplier ?? 1) * 100)}%` },
    { label: "Life Steal", value: formatPercent(stats.lifeStealPct) },
    { label: "Regen", value: `${Math.round((stats.hpRegen ?? 0) * 10) / 10}` }
  ];
}

function buildArenaSurvivorShopModel(
  context: ControllerGameRenderContext,
  state: ArenaSurvivorState,
  player: ArenaSurvivorPlayerState
): ShopLayoutModel {
  const currentPlayerReady = Boolean(context.state.player?.isReady);
  const language = context.state.room?.language;
  const en = language === "en";
  const playerCount = context.state.room?.players?.length ?? 0;
  const readyCount = (context.state.room?.players ?? []).filter((roomPlayer) => roomPlayer.isReady).length;
  const waitingForPlayers = readyCount < playerCount;
  const combineCounts = player.loadout.weapons.reduce((counts, weapon) => {
    const key = `${weapon.weaponId}:${weapon.level}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return {
    kind: "shop",
    language,
    title: `${player.name} Shop`,
    subtitle: `${en ? "Wave" : "Welle"} ${state.waveNumber} | Material ${player.materials}`,
    helperText:
      waitingForPlayers
        ? en
          ? `Waiting for all players. ${readyCount}/${playerCount} ready.`
          : `Warte auf alle Spieler. ${readyCount}/${playerCount} bereit.`
        : player.shop.available
          ? en
            ? "Choose your upgrades for the next wave."
            : "Waehle deine Upgrades fuer die naechste Welle."
          : en
            ? "Ready check complete. The next wave starts soon."
            : "Bereitmeldung abgeschlossen. Die naechste Welle startet gleich.",
    disabled: false,
    accentColor: player.color,
    waveNumber: state.waveNumber,
    materials: player.materials,
    ready: context.onSetReady
      ? {
          currentPlayerReady,
          readyCount,
          playerCount,
          language,
          label: en ? "Next Wave" : "Naechste Welle",
          description: waitingForPlayers
            ? en
              ? "Buy upgrades, then ready up."
              : "Kaufe Upgrades und druecke dann auf bereit."
            : en
              ? "Everyone is ready. The next wave starts automatically."
              : "Alle sind bereit. Die naechste Welle startet automatisch.",
          onToggleReady: () => {
            context.onSetReady?.(!currentPlayerReady);
          }
        }
      : undefined,
    reroll: {
      cost: player.shop.rerollCost,
      count: player.shop.rerollCount,
      affordable: player.shop.canReroll,
      onReroll: () => {
        if (!player.playerId) {
          return;
        }

        context.onInput(createArenaSurvivorShopRerollInput(player.playerId));
      }
    },
    loadout: {
      weapons: player.loadout.weapons.map((weapon) => ({
        weaponInstanceId: weapon.weaponInstanceId,
        weaponId: weapon.weaponId,
        level: weapon.level,
        maxLevel: weapon.maxLevel,
        displayName: weapon.displayName,
        description: weapon.description,
        iconPath: weapon.iconPath,
        sellValue: weapon.sellValue,
        sellable: weapon.sellable,
        canCombine:
          weapon.level < weapon.maxLevel &&
          (combineCounts.get(`${weapon.weaponId}:${weapon.level}`) ?? 0) > 1,
        stats: buildLoadoutWeaponStats(weapon.detailLines)
      })),
      items: player.loadout.items
    },
    runSummary: player.runSummary,
    playerStats: resolvePlayerStats(player),
    offers: enrichArenaSurvivorShopOffers(player.shop.offers),
    onBuy: (offerId) => {
      if (!player.playerId) {
        return;
      }

      context.onInput(createArenaSurvivorShopInput(player.playerId, offerId));
    },
    onSellWeapon: (weaponInstanceId) => {
      if (!player.playerId) {
        return;
      }

      context.onInput(createArenaSurvivorShopSellInput(player.playerId, weaponInstanceId));
    },
    onCombineWeapon: (weaponInstanceId) => {
      if (!player.playerId) {
        return;
      }

      context.onInput(createArenaSurvivorShopCombineInput(player.playerId, weaponInstanceId));
    }
  };
}

function buildArenaSurvivorJoystickModel(
  context: ControllerGameRenderContext,
  state: ArenaSurvivorState | null,
  player: ArenaSurvivorPlayerState | null
): VirtualJoystickLayoutModel {
  const playerId = context.state.player?.id ?? "";
  const language = context.state.room?.language;
  const en = language === "en";
  const running =
    context.state.game?.phase === "playing" &&
    Boolean(player?.alive) &&
    state?.result.outcome === "running";
  const timeText =
    state?.result.outcome === "running"
      ? `${en ? "Time" : "Zeit"} ${formatTime(state.remainingMs)}`
      : `${en ? "Survived" : "Ueberlebt"} ${formatTime(state?.elapsedMs ?? 0)}`;

  return {
    kind: "virtual_joystick",
    title: player?.name ?? "Arena Survivor",
    subtitle: running
      ? en
        ? "Move freely. Auto-fire is active."
        : "Bewege dich frei. Automatische Schuesse laufen."
      : en
        ? "Waiting for the next round"
        : "Warte auf die naechste Runde",
    helperText:
      state?.result.outcome === "running"
        ? en
          ? "Your weapon fires automatically. Collect material for your own shop."
          : "Deine Waffe schiesst automatisch. Sammle Material fuer deinen eigenen Shop."
        : state?.result.title ?? (en ? "Move your character with the virtual stick." : "Bewege den Charakter mit dem virtuellen Stick."),
    disabled: !running,
    accentColor: player?.color ?? context.state.player?.color ?? "#38bdf8",
    resetKey: `${context.state.game?.roundNumber ?? 0}:${context.state.game?.phase ?? "idle"}`,
    centerLabel: "GO",
    stats: [
      { label: "HP", value: `${formatRoundedHp(player?.hp)}/${formatRoundedHp(player?.maxHp)}` },
      { label: "Kills", value: `${player?.runStats.kills ?? 0}` },
      { label: "Material", value: `${player?.materials ?? 0}` },
      { label: "Status", value: formatStatus(player, state, en), highlighted: true },
      { label: en ? "Time" : "Zeit", value: timeText },
      { label: en ? "Wave" : "Welle", value: `${state?.waveNumber ?? 1}` }
    ],
    onMoveChange: (moveX, moveY) => {
      if (!playerId) {
        return;
      }

      context.onInput(createArenaSurvivorMoveInput(playerId, moveX, moveY));
    }
  };
}

export function buildArenaSurvivorControllerModel(
  context: ControllerGameRenderContext
): ShopLayoutModel | VirtualJoystickLayoutModel {
  const gameState = (context.state.game?.state ?? null) as ArenaSurvivorState | null;
  const currentPlayer = resolveCurrentPlayer(context, gameState);
  const shouldShowShop =
    Boolean(currentPlayer) &&
    gameState?.result.outcome === "survived" &&
    (Boolean(currentPlayer?.shop.available) ||
      context.state.game?.phase === "result" ||
      context.state.game?.phase === "scoreboard" ||
      context.state.game?.phase === "finished" ||
      context.state.game?.phase === "locked");

  if (gameState && currentPlayer && shouldShowShop) {
    return buildArenaSurvivorShopModel(context, gameState, currentPlayer);
  }

  return buildArenaSurvivorJoystickModel(context, gameState, currentPlayer);
}
