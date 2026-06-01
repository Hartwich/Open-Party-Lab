import { useEffect, useMemo, useState } from "react";
import type { MagicArenaLayoutModel } from "./models.js";
import { ReadyPanel } from "../common/ReadyPanel.js";

interface MagicArenaLayoutProps {
  model: MagicArenaLayoutModel;
}

interface MagicArenaCoord {
  q: number;
  r: number;
}

type MagicArenaBaseActionId = "move" | "punch" | "dig";
type MagicArenaCardId =
  | "sprint"
  | "charge_run"
  | "enemy_swap"
  | "lightning_strike"
  | "fireball"
  | "hammer_blow"
  | "bomb"
  | "meteor_strike"
  | "rift"
  | "earthquake"
  | "platform_break"
  | "stealth"
  | "shockwave"
  | "chain_lightning"
  | "pitfall"
  | "teleport"
  | "kraken"
  | "time_rift"
  | "magic_mine"
  | "storm_cloud";

interface MagicArenaCardInstanceState {
  instanceId: string;
  cardId: MagicArenaCardId;
}

interface MagicArenaFieldState {
  coord: MagicArenaCoord;
  exists: boolean;
  hp: number;
  maxHp: number;
  type: "weak" | "normal" | "strong";
  specialType: "crystal" | "explosive" | "cracked" | null;
  occupants: string[];
}

interface MagicArenaFigureState {
  figureId: string;
  playerId: string;
  name: string;
  hp: number;
  maxHp: number;
  status: "alive" | "in_water" | "eliminated";
  coord?: MagicArenaCoord;
  waterCoord?: MagicArenaCoord;
  rescueDeadlineRound?: number;
  stealthUntilRound?: number;
}

interface MagicArenaBoardObjectState {
  id: string;
  type: "bomb" | "pitfall" | "magic_mine" | "storm_cloud_marker" | "time_rift_marker";
  ownerPlayerId: string;
  coord: MagicArenaCoord;
  visibleTo: "all" | "owner" | "debug";
  createdRound: number;
  createdSlot: number | null;
  triggerRound?: number;
  triggerSlot?: number;
}

interface MagicArenaPlannedAction {
  playerId: string;
  slotIndex: number;
  figureId: string;
  actionKind: "base" | "card";
  baseActionId?: MagicArenaBaseActionId;
  cardInstanceId?: string;
  cardId?: MagicArenaCardId;
  targetCoord?: MagicArenaCoord;
  path?: MagicArenaCoord[];
  direction?: number;
  distance?: number;
  extra?: Record<string, unknown>;
}

interface MagicArenaCardDefinition {
  cardId: MagicArenaCardId;
  name: string;
  type: string;
  frequency: number;
  range: number | null;
  description: string;
}

interface MagicArenaPlayerState {
  playerId: string;
  name: string;
  color: string;
  handCount: number;
  figures: MagicArenaFigureState[];
  ready: boolean;
  connected: boolean;
}

interface MagicArenaControllerPlayerState extends MagicArenaPlayerState {
  hand: MagicArenaCardInstanceState[];
  requiredSlots: number;
}

interface MagicArenaBoardState {
  radius: number;
  fieldsByCoord: Record<string, MagicArenaFieldState>;
}

interface MagicArenaPendingBombState {
  bombId: string;
  ownerPlayerId: string;
  coord: MagicArenaCoord;
  explodeRound: number;
  explodeSlot: number;
}

interface MagicArenaRoundEventState {
  id: string;
  eventId: string;
  name: string;
  description: string;
  roundIndex: number;
  markedCoords: MagicArenaCoord[];
  direction?: number;
}

interface MagicArenaActiveActionState {
  kind: string;
  roundIndex: number;
  slotIndex: number | null;
  label: string;
  resultLabel?: string;
}

interface MagicArenaControllerState {
  magicPhase: "setup" | "planning" | "execution" | "game_over";
  roundIndex: number;
  currentSlot: number | null;
  players: MagicArenaPlayerState[];
  board: MagicArenaBoardState;
  pendingBombs: MagicArenaPendingBombState[];
  boardObjects: MagicArenaBoardObjectState[];
  plannedActionsByPlayer: Record<string, MagicArenaPlannedAction[]>;
  activeAction?: MagicArenaActiveActionState;
  currentRoundEvent?: MagicArenaRoundEventState;
  winnerPlayerId?: string;
  cardDefinitions: MagicArenaCardDefinition[];
  ownPlayer: MagicArenaControllerPlayerState | null;
}

type DraftMode = "base:move" | "base:punch" | "base:dig" | `card:${MagicArenaCardInstanceState["instanceId"]}`;

const directionLabels = ["E", "NE", "NW", "W", "SW", "SE"];
const hexDirections: MagicArenaCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
];

function axialKey(coord: MagicArenaCoord): string {
  return `${coord.q},${coord.r}`;
}

function sameCoord(left: MagicArenaCoord | null | undefined, right: MagicArenaCoord | null | undefined): boolean {
  return Boolean(left && right && left.q === right.q && left.r === right.r);
}

function axialToBoardPoint(coord: MagicArenaCoord): { x: number; y: number } {
  return {
    x: Math.sqrt(3) * (coord.q + coord.r / 2),
    y: 1.5 * coord.r
  };
}

function addCoords(left: MagicArenaCoord, right: MagicArenaCoord): MagicArenaCoord {
  return {
    q: left.q + right.q,
    r: left.r + right.r
  };
}

function getNeighbors(coord: MagicArenaCoord): MagicArenaCoord[] {
  return hexDirections.map((direction) => addCoords(coord, direction));
}

function hexDistance(left: MagicArenaCoord, right: MagicArenaCoord): number {
  return (
    Math.abs(left.q - right.q) +
    Math.abs(left.r - right.r) +
    Math.abs(left.q + left.r - right.q - right.r)
  ) / 2;
}

function getCardNeedsPath(cardId: MagicArenaCardId | undefined): number {
  return cardId === "sprint" ? 4 : 0;
}

function getTargetRange(
  mode: DraftMode,
  cardId: MagicArenaCardId | undefined,
  cardRange: number | null | undefined
): number | null {
  if (mode === "base:move") {
    return 2;
  }

  if (mode === "base:punch") {
    return 1;
  }

  if (mode === "base:dig") {
    return null;
  }

  return cardId === "sprint" ? 4 : cardRange ?? null;
}

function needsDirection(cardId: MagicArenaCardId | undefined, sameFieldHammer: boolean): boolean {
  return cardId === "hammer_blow" && sameFieldHammer;
}

function needsTarget(cardId: MagicArenaCardId | undefined): boolean {
  return Boolean(
    cardId &&
      !["charge_run", "earthquake", "stealth", "shockwave", "sprint"].includes(cardId)
  );
}

function isSelfOnlyCard(cardId: MagicArenaCardId | undefined): boolean {
  return cardId === "earthquake" || cardId === "stealth" || cardId === "shockwave";
}

function getBaseActionDescription(mode: DraftMode, en: boolean): string | null {
  switch (mode) {
    case "base:move":
      return en ? "Move the selected figure up to 2 free hexes." : "Bewege die gewaehlte Figur bis zu 2 freie Hexfelder.";
    case "base:punch":
      return en
        ? "Hit an enemy on your own or an adjacent hex. If no enemy is there, damage the field."
        : "Trifft einen Gegner auf dem eigenen oder angrenzenden Feld. Wenn keiner dort steht, nimmt das Feld Schaden.";
    case "base:dig":
      return en
        ? "Reduce your current field by 1 HP and find cards, or sometimes a buried bomb."
        : "Baut das eigene Feld um 1 ab und findet Karten, manchmal aber eine vergrabene Bombe.";
    default:
      return null;
  }
}

function getActionIcon(actionId: MagicArenaBaseActionId | MagicArenaCardId | undefined): string {
  switch (actionId as string | undefined) {
    case "move":
      return "→";
    case "punch":
      return "●";
    case "sprint":
      return "⇥";
    case "charge_run":
      return "»";
    case "ally_swap":
      return "↔";
    case "enemy_swap":
      return "⇄";
    case "lightning_strike":
      return "ϟ";
    case "fireball":
      return "✹";
    case "hammer_blow":
      return "⌁";
    case "bomb":
      return "●";
    case "meteor_strike":
      return "✦";
    case "rift":
      return "◇";
    case "earthquake":
      return "≋";
    case "platform_break":
      return "◫";
    case "stealth":
      return "◌";
    case "magnet_pull":
      return "⊙";
    case "shockwave":
      return ")))";
    case "chain_lightning":
      return "CL";
    case "pitfall":
      return "PF";
    case "teleport":
      return "TP";
    case "kraken":
      return "KR";
    case "time_rift":
      return "ZR";
    case "magic_mine":
      return "MM";
    case "storm_cloud":
      return "GW";
    default:
      return "?";
  }
}

function getPlannedActionIcon(action: MagicArenaPlannedAction | undefined): string {
  if (!action) {
    return "-";
  }

  return action.actionKind === "base" ? getActionIcon(action.baseActionId) : getActionIcon(action.cardId);
}

function getActionIconPath(actionId: MagicArenaBaseActionId | MagicArenaCardId | undefined): string | null {
  return actionId ? `/magic-arena/${actionId}.svg` : null;
}

function getPlannedActionId(action: MagicArenaPlannedAction | undefined): MagicArenaBaseActionId | MagicArenaCardId | undefined {
  if (!action) {
    return undefined;
  }

  return action.actionKind === "base" ? action.baseActionId : action.cardId;
}

function ActionIcon({
  actionId,
  large = false
}: {
  actionId: MagicArenaBaseActionId | MagicArenaCardId | undefined;
  large?: boolean;
}) {
  const src = getActionIconPath(actionId);

  if (!src) {
    return <span style={emptyIconStyle}>-</span>;
  }

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width: large ? 30 : 24,
        height: large ? 30 : 24,
        display: "block",
        objectFit: "contain",
        pointerEvents: "none"
      }}
    />
  );
}

function getHexObjectVariantStyle(type: MagicArenaBoardObjectState["type"]) {
  switch (type) {
    case "magic_mine":
      return {
        background: "#0f172a",
        borderColor: "rgba(248,113,113,0.86)",
        boxShadow: "0 0 8px rgba(248,113,113,0.42)"
      } as const;
    case "pitfall":
      return {
        background: "rgba(15,23,42,0.76)",
        borderColor: "rgba(148,163,184,0.72)"
      } as const;
    case "time_rift_marker":
      return {
        background: "rgba(88,28,135,0.72)",
        borderColor: "rgba(216,180,254,0.82)",
        boxShadow: "0 0 9px rgba(192,132,252,0.42)"
      } as const;
    default:
      return {
        background: "#111827",
        borderColor: "rgba(248,250,252,0.52)"
      } as const;
  }
}

interface BoardCellLayout {
  field: MagicArenaFieldState;
  key: string;
  left: number;
  top: number;
}

interface BoardFigureDot {
  figure: MagicArenaFigureState;
  color: string;
  own: boolean;
}

interface BoardBombDot {
  planned: boolean;
}

interface BoardObjectDot {
  type: MagicArenaBoardObjectState["type"];
}

interface PlannedBoardMarker {
  path: boolean;
  target: boolean;
  area: boolean;
  self: boolean;
}

export function MagicArenaLayout({ model }: MagicArenaLayoutProps) {
  const en = model.language === "en";
  const state = model.state as MagicArenaControllerState;
  const ownPlayer = state.ownPlayer;
  const ownPlans = state.plannedActionsByPlayer?.[model.currentPlayerId] ?? [];
  const cardDefinitions = state.cardDefinitions ?? [];
  const fieldsByCoord = state.board?.fieldsByCoord ?? {};
  const [slotIndex, setSlotIndex] = useState(0);
  const [figureId, setFigureId] = useState<string | null>(null);
  const [mode, setMode] = useState<DraftMode>("base:move");
  const [path, setPath] = useState<MagicArenaCoord[]>([]);
  const [targetCoord, setTargetCoord] = useState<MagicArenaCoord | null>(null);
  const [direction, setDirection] = useState<number>(0);
  const [distance, setDistance] = useState<number>(1);
  const [swapTargetFigureId, setSwapTargetFigureId] = useState<string | null>(null);

  const cardByInstanceId = useMemo(
    () => new Map((ownPlayer?.hand ?? []).map((card) => [card.instanceId, card] as const)),
    [ownPlayer?.hand]
  );
  const cardNames = useMemo(
    () => new Map(cardDefinitions.map((definition) => [definition.cardId, definition.name] as const)),
    [cardDefinitions]
  );
  const selectedCardInstanceId = mode.startsWith("card:") ? mode.slice("card:".length) : null;
  const selectedCard = selectedCardInstanceId ? cardByInstanceId.get(selectedCardInstanceId) : undefined;
  const selectedCardDefinition = selectedCard ? cardDefinitions.find((definition) => definition.cardId === selectedCard.cardId) : undefined;
  const selectedFigure = ownPlayer?.figures.find((figure) => figure.figureId === figureId);
  const plannedFigureIds = useMemo(
    () => new Set(ownPlans.filter((plan) => plan.slotIndex !== slotIndex).map((plan) => plan.figureId)),
    [ownPlans, slotIndex]
  );
  const plannedCardIds = useMemo(
    () => new Set(ownPlans.filter((plan) => plan.slotIndex !== slotIndex).map((plan) => plan.cardInstanceId).filter(Boolean)),
    [ownPlans, slotIndex]
  );
  const targetSameAsFigure = Boolean(selectedFigure?.coord && targetCoord && axialKey(selectedFigure.coord) === axialKey(targetCoord));
  const currentCardId = selectedCard?.cardId;
  const pathLimit = mode === "base:move" ? 2 : getCardNeedsPath(currentCardId);
  const targetRange = getTargetRange(mode, currentCardId, selectedCardDefinition?.range);
  const selectableSlots = Math.max(0, ownPlayer?.requiredSlots ?? 0);
  const ready = Boolean(ownPlayer?.ready);
  const plannedSlotCount = useMemo(() => new Set(ownPlans.map((plan) => plan.slotIndex)).size, [ownPlans]);
  const canReady = plannedSlotCount >= selectableSlots && selectableSlots >= 0 && !ready && state.magicPhase === "planning";
  const actionComplete = Boolean(buildDraftAction());
  const selectedActionDescription = selectedCardDefinition?.description ?? getBaseActionDescription(mode, en);
  const boardCells = useMemo<BoardCellLayout[]>(() => {
    const fields = Object.values(fieldsByCoord).sort(
      (left, right) => left.coord.r - right.coord.r || left.coord.q - right.coord.q
    );

    if (fields.length === 0) {
      return [];
    }

    const projected = fields.map((field) => ({
      field,
      key: axialKey(field.coord),
      point: axialToBoardPoint(field.coord)
    }));
    const xs = projected.map((entry) => entry.point.x);
    const ys = projected.map((entry) => entry.point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);

    return projected.map((entry) => ({
      field: entry.field,
      key: entry.key,
      left: 7 + ((entry.point.x - minX) / spanX) * 86,
      top: 7 + ((entry.point.y - minY) / spanY) * 86
    }));
  }, [fieldsByCoord]);
  const boardFiguresByKey = useMemo(() => {
    const figuresByKey = new Map<string, BoardFigureDot[]>();

    for (const player of state.players ?? []) {
      for (const figure of player.figures) {
        const coord = figure.status === "alive" ? figure.coord : figure.status === "in_water" ? figure.waterCoord : null;

        if (!coord) {
          continue;
        }

        const key = axialKey(coord);
        const figures = figuresByKey.get(key) ?? [];
        figures.push({
          figure,
          color: player.color,
          own: player.playerId === model.currentPlayerId
        });
        figuresByKey.set(key, figures);
      }
    }

    for (const figures of figuresByKey.values()) {
      figures.sort((left, right) => Number(right.own) - Number(left.own) || left.figure.figureId.localeCompare(right.figure.figureId));
    }

    return figuresByKey;
  }, [model.currentPlayerId, state.players]);
  const boardBombsByKey = useMemo(() => {
    const bombsByKey = new Map<string, BoardBombDot[]>();
    const addBomb = (coord: MagicArenaCoord | undefined, bomb: BoardBombDot) => {
      if (!coord) {
        return;
      }

      const key = axialKey(coord);
      const bombs = bombsByKey.get(key) ?? [];
      bombs.push(bomb);
      bombsByKey.set(key, bombs);
    };

    for (const bomb of state.pendingBombs ?? []) {
      addBomb(bomb.coord, {
        planned: false
      });
    }

    for (const plan of ownPlans) {
      if (plan.cardId === "bomb") {
        addBomb(plan.targetCoord, {
          planned: true
        });
      }
    }

    return bombsByKey;
  }, [ownPlans, state.pendingBombs]);
  const boardObjectsByKey = useMemo(() => {
    const objectsByKey = new Map<string, BoardObjectDot[]>();

    for (const object of state.boardObjects ?? []) {
      if (object.type === "storm_cloud_marker") {
        continue;
      }

      const key = axialKey(object.coord);
      const objects = objectsByKey.get(key) ?? [];
      objects.push({
        type: object.type
      });
      objectsByKey.set(key, objects);
    }

    return objectsByKey;
  }, [state.boardObjects]);
  const plannedMarkersByKey = useMemo(() => {
    const markersByKey = new Map<string, PlannedBoardMarker>();
    const figuresById = new Map((ownPlayer?.figures ?? []).map((figure) => [figure.figureId, figure] as const));

    const addMarker = (coord: MagicArenaCoord | undefined, kind: keyof PlannedBoardMarker) => {
      if (!coord) {
        return;
      }

      const key = axialKey(coord);
      const marker = markersByKey.get(key) ?? { path: false, target: false, area: false, self: false };
      marker[kind] = true;
      markersByKey.set(key, marker);
    };

    for (const plan of ownPlans) {
      const figure = figuresById.get(plan.figureId);
      const actionId = getPlannedActionId(plan);

      const plannedPath = plan.path ?? [];

      if (plannedPath.length > 0) {
        plannedPath.forEach((coord, index) => addMarker(coord, index === plannedPath.length - 1 ? "target" : "path"));
        continue;
      }

      if (actionId === "charge_run" && figure?.coord && plan.direction !== undefined && plan.distance !== undefined) {
        const directionCoord = hexDirections[plan.direction];

        if (directionCoord) {
          for (let step = 1; step <= plan.distance; step += 1) {
            addMarker(
              {
                q: figure.coord.q + directionCoord.q * step,
                r: figure.coord.r + directionCoord.r * step
              },
              step === plan.distance ? "target" : "path"
            );
          }
        }
        continue;
      }

      if (plan.targetCoord) {
        addMarker(plan.targetCoord, "target");

        if (actionId === "bomb" || actionId === "meteor_strike" || actionId === "magic_mine") {
          for (const coord of getNeighbors(plan.targetCoord)) {
            addMarker(coord, "area");
          }
        }
        continue;
      }

      if (figure?.coord) {
        addMarker(figure.coord, "self");
      }
    }

    return markersByKey;
  }, [ownPlans, ownPlayer?.figures]);
  const movePathsByTargetKey = useMemo(() => {
    const paths = new Map<string, MagicArenaCoord[]>();

    if (!selectedFigure?.coord || pathLimit <= 0) {
      return paths;
    }

    for (const cell of boardCells) {
      const pathToCell = findShortestMovePath(selectedFigure.coord, cell.field.coord, pathLimit);

      if (pathToCell.length > 0) {
        paths.set(cell.key, pathToCell);
      }
    }

    return paths;
  }, [boardCells, fieldsByCoord, pathLimit, selectedFigure]);
  const validTargetKeys = useMemo(() => {
    const keys = new Set<string>();

    if (!selectedFigure?.coord) {
      return keys;
    }

    if (pathLimit > 0) {
      for (const key of movePathsByTargetKey.keys()) {
        keys.add(key);
      }
      return keys;
    }

    for (const cell of boardCells) {
      if (canTargetCoord(cell.field.coord)) {
        keys.add(cell.key);
      }
    }

    return keys;
  }, [boardCells, currentCardId, mode, movePathsByTargetKey, pathLimit, selectedFigure, targetRange, boardFiguresByKey, fieldsByCoord, ownPlayer, state.boardObjects]);
  const effectPreviewKeys = useMemo(() => {
    const keys = new Set<string>();

    if (!selectedFigure?.coord) {
      return keys;
    }

    if (currentCardId === "earthquake" || currentCardId === "shockwave") {
      for (const coord of getNeighbors(selectedFigure.coord)) {
        keys.add(axialKey(coord));
      }
    }

    if (mode === "base:dig") {
      keys.add(axialKey(selectedFigure.coord));
    }

    if (currentCardId === "charge_run" && targetCoord) {
      const directionCoord = hexDirections[direction];

      if (directionCoord) {
        for (let step = 1; step <= distance; step += 1) {
          keys.add(axialKey({
            q: selectedFigure.coord.q + directionCoord.q * step,
            r: selectedFigure.coord.r + directionCoord.r * step
          }));
        }
      }
    }

    if ((currentCardId === "bomb" || currentCardId === "meteor_strike" || currentCardId === "magic_mine") && targetCoord) {
      keys.add(axialKey(targetCoord));
      for (const coord of getNeighbors(targetCoord)) {
        keys.add(axialKey(coord));
      }
    }

    if ((currentCardId === "time_rift" || currentCardId === "storm_cloud" || currentCardId === "pitfall") && targetCoord) {
      keys.add(axialKey(targetCoord));
    }

    return keys;
  }, [currentCardId, direction, distance, mode, selectedFigure, targetCoord]);
  const roundEventMarkedKeys = useMemo(
    () => new Set((state.currentRoundEvent?.markedCoords ?? []).map((coord) => axialKey(coord))),
    [state.currentRoundEvent]
  );
  const pathKeys = new Map(path.map((coord, index) => [axialKey(coord), index + 1]));
  const firstOpenSlot = useMemo(() => findFirstOpenSlot(), [ownPlans, selectableSlots]);

  useEffect(() => {
    setSlotIndex(firstOpenSlot);
    setFigureId(null);
    setMode("base:move");
    setPath([]);
    setTargetCoord(null);
    setDirection(0);
    setDistance(1);
    setSwapTargetFigureId(null);
  }, [firstOpenSlot, model.resetKey]);

  function resetTargets(nextMode = mode): void {
    setMode(nextMode);
    setPath([]);
    setTargetCoord(null);
    setDirection(0);
    setDistance(1);
    setSwapTargetFigureId(null);
  }

  function selectFigure(nextFigureId: string): void {
    setFigureId(nextFigureId);
    setPath([]);
    setTargetCoord(null);
    setSwapTargetFigureId(null);
  }

  function isFieldOpenForPath(coord: MagicArenaCoord, start: MagicArenaCoord): boolean {
    if (sameCoord(coord, start)) {
      return true;
    }

    const field = fieldsByCoord[axialKey(coord)];
    return Boolean(field?.exists && field.occupants.length === 0);
  }

  function findShortestMovePath(
    start: MagicArenaCoord,
    target: MagicArenaCoord,
    maxLength: number
  ): MagicArenaCoord[] {
    if (sameCoord(start, target) || maxLength <= 0) {
      return [];
    }

    const visited = new Set([axialKey(start)]);
    const queue: { coord: MagicArenaCoord; path: MagicArenaCoord[] }[] = [{ coord: start, path: [] }];

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];

      if (!current || current.path.length >= maxLength) {
        continue;
      }

      for (const neighbor of getNeighbors(current.coord)) {
        const key = axialKey(neighbor);

        if (visited.has(key) || !isFieldOpenForPath(neighbor, start)) {
          continue;
        }

        const nextPath = [...current.path, neighbor];

        if (sameCoord(neighbor, target)) {
          return nextPath;
        }

        visited.add(key);
        queue.push({ coord: neighbor, path: nextPath });
      }
    }

    return [];
  }

  function getLineTargetFromOrigin(target: MagicArenaCoord): { direction: number; distance: number } | null {
    if (!selectedFigure?.coord) {
      return null;
    }

    for (let directionIndex = 0; directionIndex < hexDirections.length; directionIndex += 1) {
      const directionCoord = hexDirections[directionIndex];

      if (!directionCoord) {
        continue;
      }

      for (let step = 1; step <= 3; step += 1) {
        if (
          selectedFigure.coord.q + directionCoord.q * step === target.q &&
          selectedFigure.coord.r + directionCoord.r * step === target.r
        ) {
          return { direction: directionIndex, distance: step };
        }
      }
    }

    return null;
  }

  function hasAliveFigureAt(coord: MagicArenaCoord, filter: "any" | "enemy" | "own" = "any"): boolean {
    return (boardFiguresByKey.get(axialKey(coord)) ?? []).some((entry) => {
      if (entry.figure.status !== "alive") {
        return false;
      }

      if (filter === "enemy") {
        return !entry.own;
      }

      if (filter === "own") {
        return entry.own;
      }

      return true;
    });
  }

  function canTargetCoord(coord: MagicArenaCoord): boolean {
    if (!selectedFigure?.coord) {
      return false;
    }

    if (mode === "base:dig") {
      return false;
    }

    if (currentCardId === "charge_run") {
      return getLineTargetFromOrigin(coord) !== null;
    }

    if (isSelfOnlyCard(currentCardId)) {
      return false;
    }

    if (targetRange !== null && targetRange !== undefined && hexDistance(selectedFigure.coord, coord) > targetRange) {
      return false;
    }

    const field = fieldsByCoord[axialKey(coord)];
    const hasBlockingObject = (state.boardObjects ?? []).some(
      (object) => sameCoord(object.coord, coord) && ["bomb", "pitfall", "magic_mine", "storm_cloud_marker"].includes(object.type)
    );

    switch (currentCardId as string | undefined) {
      case "enemy_swap":
        return hasAliveFigureAt(coord, "enemy");
      case "magnet_pull":
        return hasAliveFigureAt(coord);
      case "chain_lightning":
        return (boardFiguresByKey.get(axialKey(coord)) ?? []).some((entry) => entry.figure.status !== "eliminated");
      case "kraken":
        return (boardFiguresByKey.get(axialKey(coord)) ?? []).some((entry) => entry.figure.status === "in_water");
      case "teleport":
        return Boolean(field?.exists && field.occupants.length === 0);
      case "pitfall":
      case "magic_mine":
        return Boolean(field?.exists && field.occupants.length === 0 && !hasBlockingObject);
      case "storm_cloud":
        return !hasBlockingObject;
      case "rift":
        return Boolean(field?.exists);
      case "platform_break":
        return Boolean(field?.exists && field.hp <= 2);
      default:
        return true;
    }
  }

  function findFirstOpenSlot(): number {
    const filledSlots = new Set(ownPlans.map((plan) => plan.slotIndex));

    for (let index = 0; index < selectableSlots; index += 1) {
      if (!filledSlots.has(index)) {
        return index;
      }
    }

    return Math.max(0, selectableSlots - 1);
  }

  function findNextOpenSlotAfter(currentSlot: number): number {
    const filledSlots = new Set(ownPlans.map((plan) => plan.slotIndex));
    filledSlots.add(currentSlot);

    for (let offset = 1; offset <= selectableSlots; offset += 1) {
      const candidate = (currentSlot + offset) % Math.max(1, selectableSlots);

      if (!filledSlots.has(candidate)) {
        return candidate;
      }
    }

    return Math.max(0, Math.min(currentSlot, selectableSlots - 1));
  }

  function buildDraftAction(): Omit<MagicArenaPlannedAction, "playerId" | "slotIndex"> | null {
    if (!selectedFigure || model.disabled) {
      return null;
    }

    if (mode === "base:move") {
      return path.length > 0
        ? {
            figureId: selectedFigure.figureId,
            actionKind: "base",
            baseActionId: "move",
            path
          }
        : null;
    }

    if (mode === "base:punch") {
      return targetCoord
        ? {
            figureId: selectedFigure.figureId,
            actionKind: "base",
            baseActionId: "punch",
            targetCoord
          }
        : null;
    }

    if (mode === "base:dig") {
      return {
        figureId: selectedFigure.figureId,
        actionKind: "base",
        baseActionId: "dig"
      };
    }

    if (!selectedCard) {
      return null;
    }

    if (selectedCard.cardId === "sprint") {
      return path.length > 0
        ? {
            figureId: selectedFigure.figureId,
            actionKind: "card",
            cardInstanceId: selectedCard.instanceId,
            cardId: selectedCard.cardId,
            path
          }
        : null;
    }

    if (selectedCard.cardId === "charge_run") {
      return targetCoord
        ? {
            figureId: selectedFigure.figureId,
            actionKind: "card",
            cardInstanceId: selectedCard.instanceId,
            cardId: selectedCard.cardId,
            direction,
            distance
          }
        : null;
    }

    if ((selectedCard.cardId as string) === "ally_swap") {
      return swapTargetFigureId
        ? {
            figureId: selectedFigure.figureId,
            actionKind: "card",
            cardInstanceId: selectedCard.instanceId,
            cardId: selectedCard.cardId,
            extra: { targetFigureId: swapTargetFigureId }
          }
        : null;
    }

    if (isSelfOnlyCard(selectedCard.cardId)) {
      return {
        figureId: selectedFigure.figureId,
        actionKind: "card",
        cardInstanceId: selectedCard.instanceId,
        cardId: selectedCard.cardId
      };
    }

    if (!targetCoord) {
      return null;
    }

    return {
      figureId: selectedFigure.figureId,
      actionKind: "card",
      cardInstanceId: selectedCard.instanceId,
      cardId: selectedCard.cardId,
      targetCoord,
      direction: needsDirection(selectedCard.cardId, targetSameAsFigure) ? direction : undefined
    };
  }

  function getOwnSelectableFigureAt(coord: MagicArenaCoord): MagicArenaFigureState | undefined {
    return ownPlayer?.figures.find(
      (figure) =>
        figure.status === "alive" &&
        sameCoord(figure.coord, coord) &&
        !plannedFigureIds.has(figure.figureId)
    );
  }

  function getOwnAliveFigureAt(coord: MagicArenaCoord): MagicArenaFigureState | undefined {
    return ownPlayer?.figures.find(
      (figure) =>
        figure.status === "alive" &&
        sameCoord(figure.coord, coord)
    );
  }

  function handleCellPress(coord: MagicArenaCoord): void {
    if (model.disabled) {
      return;
    }

    const ownFigureHere = getOwnSelectableFigureAt(coord);
    const ownAliveFigureHere = getOwnAliveFigureAt(coord);
    const hasDraftTarget = path.length > 0 || Boolean(targetCoord) || Boolean(swapTargetFigureId);

    if (!selectedFigure && ownFigureHere) {
      selectFigure(ownFigureHere.figureId);
      return;
    }

    if (
      (selectedCard?.cardId as string | undefined) === "ally_swap" &&
      selectedFigure &&
      ownAliveFigureHere &&
      ownAliveFigureHere.figureId !== selectedFigure.figureId
    ) {
      setSwapTargetFigureId(ownAliveFigureHere.figureId);
      return;
    }

    if (ownFigureHere && ownFigureHere.figureId !== figureId && !hasDraftTarget) {
      selectFigure(ownFigureHere.figureId);
      return;
    }

    if (!selectedFigure?.coord) {
      return;
    }

    if (pathLimit > 0) {
      const targetKey = axialKey(coord);
      const nextPath = movePathsByTargetKey.get(targetKey);

      if (path.length > 0 && sameCoord(path.at(-1), coord)) {
        setPath([]);
        return;
      }

      if (nextPath) {
        setPath(nextPath);
      }
      return;
    }

    if (!validTargetKeys.has(axialKey(coord))) {
      return;
    }

    if (currentCardId === "charge_run") {
      const lineTarget = getLineTargetFromOrigin(coord);

      if (!lineTarget) {
        return;
      }

      setDirection(lineTarget.direction);
      setDistance(lineTarget.distance);
    }

    setTargetCoord(coord);
  }

  function confirmSlot(): void {
    const action = buildDraftAction();

    if (!action) {
      return;
    }

    model.onPlanSlot(slotIndex, action);
    setSlotIndex(findNextOpenSlotAfter(slotIndex));
    setFigureId(null);
    resetTargets("base:move");
  }

  const phaseLabel =
    state.magicPhase === "planning"
      ? en ? "Planning" : "Planung"
      : state.magicPhase === "execution"
        ? en ? "Execution" : "Ausfuehrung"
        : en ? "Game over" : "Spielende";

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <header style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
          <strong style={{ fontSize: "1.18rem", color: "#f8fafc" }}>{model.title}</strong>
          <span style={{ color: "#bae6fd", fontWeight: 900 }}>R{state.roundIndex} {phaseLabel}</span>
        </div>
        <span style={{ color: "var(--text-muted)", lineHeight: 1.35 }}>{model.subtitle ?? model.helperText}</span>
      </header>

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      {state.currentRoundEvent ? (
        <section style={roundEventNoticeStyle}>
          <strong>{state.currentRoundEvent.name}</strong>
          <span>{state.currentRoundEvent.description}</span>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
        {Array.from({ length: Math.max(1, selectableSlots) }, (_, index) => {
          const plan = ownPlans.find((entry) => entry.slotIndex === index);
          const plannedFigure = plan ? ownPlayer?.figures.find((figure) => figure.figureId === plan.figureId) : undefined;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setSlotIndex(index)}
              style={{
                ...slotButtonStyle,
                border: slotIndex === index ? "2px solid #38bdf8" : plan ? "1px solid rgba(34,197,94,0.5)" : slotButtonStyle.border,
                background: slotIndex === index ? "rgba(14,165,233,0.24)" : plan ? "rgba(34,197,94,0.16)" : slotButtonStyle.background
              }}
            >
              {plan ? (
                <>
                  <ActionIcon actionId={getPlannedActionId(plan)} />
                  <span style={slotFigureNameStyle}>{plannedFigure?.name ?? "?"}</span>
                </>
              ) : (
                <>
                  <strong>Slot {index + 1}</strong>
                  <ActionIcon actionId={undefined} />
                </>
              )}
            </button>
          );
        })}
      </section>

      <section style={panelStyle}>
        <strong>{en ? "Action" : "Aktion"}</strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
          <button type="button" title="Move" aria-label="Move" disabled={model.disabled} onClick={() => resetTargets("base:move")} style={modeButtonStyle(mode === "base:move")}>
            <ActionIcon actionId="move" large />
          </button>
          <button type="button" title="Punch" aria-label="Punch" disabled={model.disabled} onClick={() => resetTargets("base:punch")} style={modeButtonStyle(mode === "base:punch")}>
            <ActionIcon actionId="punch" large />
          </button>
          <button type="button" title="Graben" aria-label="Graben" disabled={model.disabled} onClick={() => resetTargets("base:dig")} style={modeButtonStyle(mode === "base:dig")}>
            <ActionIcon actionId="dig" large />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6 }}>
          {(ownPlayer?.hand ?? []).map((card) => {
            const selected = selectedCardInstanceId === card.instanceId;
            const reserved = plannedCardIds.has(card.instanceId);
            const cardName = cardNames.get(card.cardId) ?? card.cardId;
            return (
              <button
                key={card.instanceId}
                type="button"
                title={cardName}
                aria-label={cardName}
                disabled={model.disabled || reserved}
                onClick={() => resetTargets(`card:${card.instanceId}`)}
                style={{
                  ...modeButtonStyle(selected),
                  opacity: model.disabled || reserved ? 0.45 : 1
                }}
              >
                <ActionIcon actionId={card.cardId} large />
              </button>
            );
          })}
        </div>
        {selectedActionDescription ? (
          <span style={{ color: "var(--text-muted)", lineHeight: 1.35 }}>{selectedActionDescription}</span>
        ) : null}
      </section>

      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
          <strong>Arena</strong>
          <span style={{ color: "var(--text-muted)" }}>
            {selectedFigure
              ? `${selectedFigure.name} ${
                  pathLimit > 0
                    ? `${path.length}/${pathLimit} | R${targetRange ?? "-"}`
                    : targetCoord
                      ? `${targetCoord.q},${targetCoord.r} | R${targetRange ?? "-"}`
                      : `R${targetRange ?? "-"}`
                }`
              : "-"}
          </span>
        </div>
        <div style={hexBoardStyle}>
          {boardCells.map((cell) => {
            const field = cell.field;
            const key = cell.key;
            const selected = targetCoord && key === axialKey(targetCoord);
            const pathStep = pathKeys.get(key);
            const selectedOwnFigure = Boolean(selectedFigure?.coord && sameCoord(selectedFigure.coord, field.coord));
            const figures = boardFiguresByKey.get(key) ?? [];
            const bombs = boardBombsByKey.get(key) ?? [];
            const objects = boardObjectsByKey.get(key) ?? [];
            const object = objects[0];
            const plannedMarker = plannedMarkersByKey.get(key);
            const validTarget = validTargetKeys.has(key);
            const effectPreview = effectPreviewKeys.has(key);
            const roundEventMarked = roundEventMarkedKeys.has(key);
            const hasOwnSelectableFigure = figures.some(
              (entry) =>
                entry.own &&
                entry.figure.status === "alive" &&
                !plannedFigureIds.has(entry.figure.figureId)
            );
            const rimColor = pathStep || selected
              ? "#facc15"
              : selectedOwnFigure
                ? "#38bdf8"
                : roundEventMarked
                  ? "#c084fc"
                  : validTarget
                    ? "#22c55e"
                    : plannedMarker?.target || plannedMarker?.self
                      ? "#60a5fa"
                      : plannedMarker?.path || plannedMarker?.area
                        ? "rgba(96,165,250,0.78)"
                        : hasOwnSelectableFigure
                          ? "rgba(56,189,248,0.78)"
                          : "rgba(148,163,184,0.2)";
            const rimWidth = pathStep || selected || selectedOwnFigure || validTarget || plannedMarker ? 3 : 1;
            const fillColor = !field.exists
              ? "rgba(14,165,233,0.22)"
              : pathStep
                ? "rgba(250,204,21,0.34)"
                : selected
                  ? "rgba(250,204,21,0.24)"
                : effectPreview
                  ? "rgba(34,197,94,0.22)"
                  : roundEventMarked
                    ? "rgba(168,85,247,0.26)"
                    : selectedOwnFigure
                      ? "rgba(56,189,248,0.28)"
                      : plannedMarker?.target || plannedMarker?.self
                        ? "rgba(96,165,250,0.3)"
                        : plannedMarker?.path
                          ? "rgba(59,130,246,0.23)"
                          : plannedMarker?.area
                            ? "rgba(14,165,233,0.18)"
                            : field.type === "strong"
                              ? "rgba(71,85,105,0.84)"
                              : field.type === "weak"
                                ? "rgba(100,116,139,0.52)"
                                : "rgba(30,41,59,0.76)";

            return (
              <button
                key={key}
                type="button"
                title={`${field.coord.q},${field.coord.r}`}
                disabled={model.disabled}
                onClick={() => handleCellPress(field.coord)}
                style={{
                  ...hexCellStyle,
                  left: `${cell.left}%`,
                  top: `${cell.top}%`,
                  background: rimColor,
                  color: field.exists ? "#e2e8f0" : "#7dd3fc",
                  opacity: model.disabled ? 0.74 : 1,
                  boxShadow: validTarget
                    ? "0 0 12px rgba(34,197,94,0.24)"
                    : plannedMarker
                      ? "0 0 10px rgba(96,165,250,0.22)"
                      : "none"
                }}
              >
                <span
                  style={{
                    ...hexCellFillStyle,
                    inset: rimWidth,
                    background: fillColor
                  }}
                />
                <span style={hexHpStyle}>{field.exists ? field.hp : ""}</span>
                {field.specialType === "cracked" ? (
                  <span style={hexCrackMarkerStyle}>
                    <span style={hexCrackMainStyle} />
                    <span style={hexCrackBranchLeftStyle} />
                    <span style={hexCrackBranchRightStyle} />
                  </span>
                ) : null}
                <span style={hexFigureDotsStyle}>
                  {figures.slice(0, 3).map((entry, index) => (
                    <span
                      key={entry.figure.figureId}
                      style={{
                        ...hexFigureDotStyle,
                        background: entry.color,
                        opacity: entry.figure.status === "in_water" ? 0.62 : entry.figure.stealthUntilRound ? 0.54 : 1,
                        transform: `translate(${(index - (Math.min(figures.length, 3) - 1) / 2) * 8}px, 3px)`,
                        boxShadow: entry.own ? "0 0 0 2px rgba(248,250,252,0.65)" : "0 0 0 1px rgba(15,23,42,0.85)"
                      }}
                    />
                  ))}
                </span>
                {bombs.length > 0 ? (
                  <span style={hexBombStyle} />
                ) : null}
                {field.specialType === "crystal" ? (
                  <span style={hexSpecialCenterStyle}>
                    <span style={hexCrystalMarkerStyle} />
                  </span>
                ) : null}
                {object ? (
                  <span style={{ ...hexObjectStyle, ...getHexObjectVariantStyle(object.type) }} />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {needsDirection(currentCardId, targetSameAsFigure) ? (
        <section style={panelStyle}>
          <strong>{en ? "Direction" : "Richtung"}</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 5 }}>
            {directionLabels.map((label, index) => (
              <button key={label} type="button" onClick={() => setDirection(index)} style={modeButtonStyle(direction === index)}>
                {label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
        <button type="button" disabled={model.disabled || !actionComplete} onClick={confirmSlot} style={primaryButtonStyle}>
          {en ? "Lock slot" : "Slot setzen"}
        </button>
        <button type="button" disabled={!canReady} onClick={model.onReady} style={canReady ? primaryButtonStyle : secondaryButtonStyle}>
          {ready ? (en ? "Ready" : "Bereit") : "Ready"}
        </button>
      </section>

      {state.magicPhase !== "planning" ? (
        <section style={panelStyle}>
          <strong>{state.activeAction?.label ?? (en ? "Waiting for execution" : "Warte auf Ausfuehrung")}</strong>
          <div style={{ display: "grid", gap: 4 }}>
            {(ownPlayer?.figures ?? []).map((figure) => (
              <span key={figure.figureId} style={{ color: "var(--text-muted)" }}>
                {figure.name}: {figure.hp}/{figure.maxHp} HP, {figure.status}
                {figure.rescueDeadlineRound ? `, bis R${figure.rescueDeadlineRound}` : ""}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

const panelStyle = {
  display: "grid",
  gap: 8,
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.14)",
  background: "rgba(2, 6, 23, 0.48)"
} as const;

const roundEventNoticeStyle = {
  display: "grid",
  gap: 4,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(196,181,253,0.38)",
  background: "rgba(49,46,129,0.44)",
  color: "#f8fafc",
  lineHeight: 1.25
} as const;

const slotButtonStyle = {
  minHeight: 56,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 10,
  background: "rgba(15, 23, 42, 0.62)",
  color: "var(--text-main)",
  display: "grid",
  gap: 3,
  placeItems: "center",
  fontSize: "0.82rem"
} as const;

const slotIconStyle = {
  fontSize: "1.05rem",
  lineHeight: 1
} as const;

const slotFigureNameStyle = {
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "#e0f2fe",
  fontSize: "0.72rem",
  lineHeight: 1.1,
  fontWeight: 900
} as const;

const actionIconStyle = {
  fontSize: "1.32rem",
  lineHeight: 1
} as const;

const emptyIconStyle = {
  fontSize: "1rem",
  lineHeight: 1,
  color: "var(--text-muted)"
} as const;

const hexBoardStyle = {
  position: "relative",
  width: "100%",
  aspectRatio: "1.16 / 1",
  minHeight: 292,
  overflow: "hidden",
  borderRadius: 10,
  border: "1px solid rgba(148, 163, 184, 0.12)",
  background: "linear-gradient(180deg, rgba(8,47,73,0.42), rgba(15,23,42,0.72))"
} as const;

const hexCellStyle = {
  position: "absolute",
  width: "8.1%",
  height: "9.35%",
  padding: 0,
  border: 0,
  transform: "translate(-50%, -50%)",
  clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  overflow: "hidden"
} as const;

const hexCellFillStyle = {
  position: "absolute",
  clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
  pointerEvents: "none"
} as const;

const hexHpStyle = {
  position: "absolute",
  top: 3,
  left: 0,
  right: 0,
  textAlign: "center",
  fontSize: "0.52rem",
  lineHeight: 1,
  color: "rgba(248,250,252,0.82)",
  pointerEvents: "none",
  zIndex: 4
} as const;

const hexFigureDotsStyle = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  pointerEvents: "none",
  zIndex: 3
} as const;

const hexFigureDotStyle = {
  position: "absolute",
  width: 10,
  height: 10,
  borderRadius: 999,
  border: "1px solid rgba(2,6,23,0.72)"
} as const;

const hexBadgeStyle = {
  position: "absolute",
  right: 4,
  bottom: 4,
  minWidth: 14,
  height: 14,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "#facc15",
  color: "#422006",
  fontSize: "0.52rem",
  lineHeight: 1,
  fontWeight: 950,
  pointerEvents: "none"
} as const;

const hexBombStyle = {
  position: "absolute",
  left: 5,
  bottom: 5,
  width: 11,
  height: 11,
  borderRadius: 999,
  background: "#111827",
  border: "1px solid rgba(248,250,252,0.48)",
  pointerEvents: "none"
} as const;

const hexObjectStyle = {
  position: "absolute",
  left: 4,
  top: 4,
  width: 12,
  height: 12,
  borderRadius: 999,
  background: "rgba(15,23,42,0.84)",
  border: "1px solid rgba(125,211,252,0.58)",
  pointerEvents: "none"
} as const;

const hexSpecialCenterStyle = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  transform: "translateY(3px)",
  pointerEvents: "none",
  zIndex: 2
} as const;

const hexCrystalMarkerStyle = {
  width: 12,
  height: 12,
  transform: "rotate(45deg)",
  borderRadius: 2,
  background: "linear-gradient(135deg, #ecfeff 0%, #67e8f9 42%, #0e7490 100%)",
  border: "1px solid rgba(240,253,250,0.88)",
  boxShadow: "0 0 9px rgba(103,232,249,0.72)"
} as const;

const hexCrackMarkerStyle = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 1
} as const;

const hexCrackMainStyle = {
  position: "absolute",
  left: "28%",
  top: "54%",
  width: "44%",
  height: 2,
  borderRadius: 999,
  background: "#020617",
  transform: "rotate(23deg)",
  boxShadow: "0 0 4px rgba(248,113,113,0.38)"
} as const;

const hexCrackBranchLeftStyle = {
  position: "absolute",
  left: "37%",
  top: "49%",
  width: "21%",
  height: 2,
  borderRadius: 999,
  background: "#020617",
  transform: "rotate(-43deg)",
  transformOrigin: "left center"
} as const;

const hexCrackBranchRightStyle = {
  position: "absolute",
  left: "51%",
  top: "57%",
  width: "24%",
  height: 2,
  borderRadius: 999,
  background: "#020617",
  transform: "rotate(-34deg)",
  transformOrigin: "left center"
} as const;

function modeButtonStyle(selected: boolean) {
  return {
    minHeight: 42,
    border: selected ? "2px solid #facc15" : "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: 10,
    background: selected ? "rgba(250, 204, 21, 0.2)" : "rgba(15, 23, 42, 0.68)",
    color: "var(--text-main)",
    fontWeight: 900,
    display: "grid",
    gap: 2,
    placeItems: "center",
    padding: "7px 8px"
  } as const;
}

const primaryButtonStyle = {
  minHeight: 50,
  border: "1px solid rgba(34, 197, 94, 0.42)",
  borderRadius: 12,
  background: "linear-gradient(180deg, #86efac, #22c55e)",
  color: "#052e16",
  fontWeight: 950
} as const;

const secondaryButtonStyle = {
  minHeight: 50,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 12,
  background: "rgba(30, 41, 59, 0.78)",
  color: "var(--text-main)",
  fontWeight: 850
} as const;
