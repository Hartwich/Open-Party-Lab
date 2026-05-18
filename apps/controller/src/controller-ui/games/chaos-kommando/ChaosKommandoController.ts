import type { ChaosKommandoState, ChaosKommandoWeaponId } from "@open-party-lab/protocol";
import type { ControllerGameRenderContext } from "../registry.js";
import type { ChaosKommandoLayoutModel, LayoutStat } from "../../layouts/models.js";
import {
  createChaosKommandoAimInput,
  createChaosKommandoFireReleaseInput,
  createChaosKommandoFireStartInput,
  createChaosKommandoJumpInput,
  createChaosKommandoMoveInput,
  createChaosKommandoSelectMercenaryInput,
  createChaosKommandoSelectWeaponInput
} from "./chaosKommandoBindings.js";

function formatSeconds(untilMs: number | undefined): string {
  if (!untilMs) {
    return "-";
  }

  return `${Math.max(0, Math.ceil((untilMs - Date.now()) / 1000))}s`;
}

function resolveCurrentPlayer(state: ChaosKommandoState | null, playerId: string | undefined) {
  return state?.players.find((player) => player.playerId === playerId) ?? null;
}

function resolveActiveMercenary(state: ChaosKommandoState | null) {
  if (!state) {
    return null;
  }

  for (const player of state.players) {
    const mercenary = player.mercenaries.find((entry) => entry.id === state.turn.activeMercenaryId);

    if (mercenary) {
      return mercenary;
    }
  }

  return null;
}

function buildStats(state: ChaosKommandoState | null, en: boolean): LayoutStat[] {
  if (!state) {
    return [];
  }

  return [
    { label: en ? "Time" : "Zeit", value: formatSeconds(state.turn.turnEndsAt), highlighted: true }
  ];
}

export function buildChaosKommandoControllerModel(
  context: ControllerGameRenderContext
): ChaosKommandoLayoutModel {
  const playerId = context.state.player?.id ?? "";
  const language = context.state.room?.language;
  const en = language === "en";
  const gameState = (context.state.game?.state ?? null) as ChaosKommandoState | null;
  const currentPlayer = resolveCurrentPlayer(gameState, playerId);
  const activeMercenary = resolveActiveMercenary(gameState);
  const currentWeapon =
    gameState?.weapons.find((weapon) => weapon.id === gameState.turn.currentWeaponId) ?? null;
  const isLocalPlayersTurn =
    context.state.game?.phase === "playing" &&
    gameState !== null &&
    gameState.turn.currentPlayerId === playerId &&
    currentPlayer !== null &&
    !currentPlayer.eliminated &&
    !gameState.winnerPlayerId;
  const disabled = !isLocalPlayersTurn;
  const title = currentPlayer?.name ? `${currentPlayer.name} Kommando` : "Chaos-Kommando";
  const subtitle = gameState?.winnerName
    ? en ? `${gameState.winnerName} wins the battle` : `${gameState.winnerName} gewinnt die Schlacht`
    : isLocalPlayersTurn
      ? en
        ? "Switch between command and controls, then line up the shot"
        : "Zwischen Kommando und Steuerung wechseln, dann sauber Druck machen"
      : activeMercenary
        ? en ? `${activeMercenary.playerName} is up` : `${activeMercenary.playerName} ist gerade dran`
        : en ? "Waiting for the next turn" : "Warte auf den naechsten Zug";
  const helperText = gameState?.winnerName
    ? en ? "Ready up again after the round for the next match." : "Druecke nach der Runde wieder auf bereit fuer das naechste Match."
    : isLocalPlayersTurn
      ? currentWeapon?.fireMode === "instant"
        ? en
          ? "In command mode, choose mercenary and weapon. In controls, pistols and similar weapons fire on press."
          : "Im Kommando-Modus Soeldner und Waffe festlegen. In der Steuerung feuern Pistole & Co. direkt beim Druck."
        : en
          ? "In command mode, choose mercenary and weapon. In controls, hold to charge and release to fire."
          : "Im Kommando-Modus Soeldner und Waffe festlegen. In der Steuerung Schuss halten, aufladen und gezielt loesen."
      : en
        ? "You can watch the match. Your controls unlock once your team is up."
        : "Du kannst das Match verfolgen. Sobald dein Team dran ist, werden die Controls freigeschaltet.";
  const fireMode = currentWeapon?.fireMode ?? "charged";
  const fireHint =
    currentWeapon?.description ??
    (fireMode === "instant"
      ? en ? "Fire immediately. No charging needed." : "Direkt feuern. Kein Aufladen noetig."
      : en ? "Hold for more power, release to fire." : "Halten = mehr Wumms, loslassen = Feuer.");

  return {
    kind: "chaos_kommando_controls",
    title,
    subtitle,
    helperText,
    language,
    disabled,
    accentColor: currentPlayer?.color ?? context.state.player?.color ?? "#22d3ee",
    resetKey: `${context.state.game?.roundNumber ?? 0}:${context.state.game?.phase ?? "idle"}:${gameState?.turn.activeMercenaryId ?? "none"}`,
    countdownEndsAtMs: gameState?.turn.turnEndsAt,
    stats: buildStats(gameState, en),
    turnOwnerLabel: activeMercenary
      ? `${activeMercenary.playerName} | ${activeMercenary.name}`
      : en ? "No active mercenary" : "Kein aktiver Soeldner",
    windLabel: gameState?.wind.label ?? (en ? "Calm wind" : "Wind ruhig"),
    fireLabel: currentWeapon?.displayName ?? "FIRE",
    fireHint,
    fireMode,
    isLocalPlayersTurn,
    mercenaries:
      currentPlayer?.mercenaries.map((mercenary) => ({
        id: mercenary.id,
        label: mercenary.name,
        subtitle: mercenary.alive ? (en ? "Ready" : "Einsatzbereit") : (en ? "Knocked out" : "Ausgeschaltet"),
        hpLabel: `${Math.max(0, Math.round(mercenary.hp))}/${mercenary.maxHp} HP`,
        iconPath: mercenary.portraitPath,
        teamColor: currentPlayer.color,
        selected: mercenary.id === gameState?.turn.activeMercenaryId,
        disabled: !mercenary.alive || !isLocalPlayersTurn,
        onSelect: () => {
          if (!playerId) {
            return;
          }

          context.onInput(createChaosKommandoSelectMercenaryInput(playerId, mercenary.id));
        }
      })) ?? [],
    weapons:
      gameState?.weapons.map((weapon) => {
        const ammo = activeMercenary?.ammo[weapon.id as ChaosKommandoWeaponId] ?? 0;
        return {
          id: weapon.id,
          label: weapon.displayName,
          subtitle: weapon.description,
          ammoLabel: `${Math.max(0, ammo)}`,
          iconPath: weapon.iconPath,
          accentColor: weapon.accentColor,
          selected: weapon.id === gameState.turn.currentWeaponId,
          disabled: ammo <= 0 || !isLocalPlayersTurn,
          onSelect: () => {
            if (!playerId) {
              return;
            }

            context.onInput(createChaosKommandoSelectWeaponInput(playerId, weapon.id));
          }
        };
      }) ?? [],
    onMoveChange: (moveX, moveY) => {
      if (!playerId) {
        return;
      }

      context.onInput(createChaosKommandoMoveInput(playerId, moveX, moveY));
    },
    onAimChange: (aimX, aimY) => {
      if (!playerId) {
        return;
      }

      context.onInput(createChaosKommandoAimInput(playerId, aimX, aimY));
    },
    onJump: () => {
      if (!playerId) {
        return;
      }

      context.onInput(createChaosKommandoJumpInput(playerId));
    },
    onFireStart: () => {
      if (!playerId) {
        return;
      }

      context.onInput(createChaosKommandoFireStartInput(playerId));
    },
    onFireEnd: () => {
      if (!playerId) {
        return;
      }

      context.onInput(createChaosKommandoFireReleaseInput(playerId));
    }
  };
}
