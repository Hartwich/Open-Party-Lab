export interface LayoutStat {
  label: string;
  value: string;
  highlighted?: boolean;
}

export interface ReadyLayoutModel {
  currentPlayerReady: boolean;
  readyCount: number;
  playerCount: number;
  label: string;
  description?: string;
  language?: import("@open-party-lab/protocol").SupportedLanguage;
  onToggleReady: () => void;
}

export interface ControllerActionButtonModel {
  id: string;
  label: string;
  accentColor?: string;
  disabled?: boolean;
  onPress: () => void;
  onRelease?: () => void;
}

export interface SingleButtonLayoutModel {
  kind: "single_button";
  title: string;
  subtitle?: string;
  buttonLabel: string;
  helperText?: string;
  disabled: boolean;
  ready?: ReadyLayoutModel;
  stats?: LayoutStat[];
  onPress: () => void;
}

export interface TapMashRow {
  label: string;
  value: string;
  highlighted?: boolean;
}

export interface TapMashLayoutModel {
  kind: "tap_mash";
  title: string;
  subtitle?: string;
  buttonLabel: string;
  helperText?: string;
  disabled: boolean;
  ready?: ReadyLayoutModel;
  progress: {
    current: number;
    max: number;
  };
  rows: TapMashRow[];
  onPress: () => void;
}

export interface ChoiceItemModel {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface ChoiceLayoutModel {
  kind: "choice";
  title: string;
  subtitle?: string;
  helperText?: string;
  disabled: boolean;
  ready?: ReadyLayoutModel;
  choices: ChoiceItemModel[];
  stats?: LayoutStat[];
  feed?: string[];
}

export interface LeftRightHoldLayoutModel {
  kind: "left_right_hold";
  title: string;
  subtitle?: string;
  helperText?: string;
  disabled: boolean;
  accentColor?: string;
  statusLabel: string;
  statusKey: string;
  leftLabel: string;
  rightLabel: string;
  ready?: ReadyLayoutModel;
  stats?: LayoutStat[];
  onLeftChange: (active: boolean) => void;
  onRightChange: (active: boolean) => void;
}

export interface DPadLayoutModel {
  kind: "dpad";
  title: string;
  subtitle?: string;
  helperText?: string;
  hideHeader?: boolean;
  horizontalOnly?: boolean;
  inlineActionButtons?: boolean;
  directionLabels?: Partial<Record<"up" | "down" | "left" | "right", string>>;
  disabled: boolean;
  accentColor?: string;
  resetKey: string;
  ready?: ReadyLayoutModel;
  stats?: LayoutStat[];
  actionButtons?: ControllerActionButtonModel[];
  actionButtonColumns?: 1 | 2 | 3 | 4;
  onMoveChange: (moveX: number, moveY: number) => void;
}

export interface VirtualJoystickLayoutModel {
  kind: "virtual_joystick";
  title: string;
  subtitle?: string;
  helperText?: string;
  minimal?: boolean;
  disabled: boolean;
  accentColor?: string;
  resetKey: string;
  centerLabel?: string;
  ready?: ReadyLayoutModel;
  stats?: LayoutStat[];
  actionButtons?: ControllerActionButtonModel[];
  actionButtonColumns?: 1 | 2 | 3 | 4;
  onMoveChange: (moveX: number, moveY: number) => void;
}

export type RacingControlKey = "left" | "right" | "throttle" | "brake" | "drift" | "boost";

export interface RacingControlsState {
  steering: number;
  throttle: boolean;
  brake: boolean;
  drift: boolean;
  boost: boolean;
}

export interface RacingControlsLayoutModel {
  kind: "racing_controls";
  disabled: boolean;
  accentColor?: string;
  resetKey: string;
  onControlsChange: (controls: RacingControlsState) => void;
}

export interface ChaosKommandoMercenaryOptionModel {
  id: string;
  label: string;
  subtitle: string;
  hpLabel: string;
  iconPath?: string;
  teamColor?: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface ChaosKommandoWeaponOptionModel {
  id: string;
  label: string;
  subtitle: string;
  ammoLabel: string;
  iconPath?: string;
  accentColor?: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface ChaosKommandoLayoutModel {
  kind: "chaos_kommando_controls";
  title: string;
  subtitle?: string;
  helperText?: string;
  language?: import("@open-party-lab/protocol").SupportedLanguage;
  disabled: boolean;
  accentColor?: string;
  resetKey: string;
  countdownEndsAtMs?: number;
  ready?: ReadyLayoutModel;
  stats?: LayoutStat[];
  turnOwnerLabel: string;
  windLabel: string;
  fireLabel: string;
  fireHint?: string;
  fireMode: "charged" | "instant";
  isLocalPlayersTurn: boolean;
  mercenaries: ChaosKommandoMercenaryOptionModel[];
  weapons: ChaosKommandoWeaponOptionModel[];
  onMoveChange: (moveX: number, moveY: number) => void;
  onAimChange: (aimX: number, aimY: number) => void;
  onJump: () => void;
  onFireStart: () => void;
  onFireEnd: () => void;
}


export interface TwinStickLayoutModel {
  kind: "twin_stick";
  title: string;
  subtitle?: string;
  helperText?: string;
  disabled: boolean;
  accentColor?: string;
  resetKey: string;
  stats?: LayoutStat[];
  leftStickLabel?: string;
  rightStickLabel?: string;
  interactButton?: ControllerActionButtonModel;
  onMoveChange: (moveX: number, moveY: number) => void;
  onAimChange: (aimX: number, aimY: number) => void;
}

export type SpellCastingSpellId = string;
export type SpellCastingGestureColor = "red" | "blue" | "green";
export type SpellCastingGestureShape =
  | "vertical_up"
  | "vertical_down"
  | "triangle"
  | "circle"
  | "square"
  | "zigzag"
  | "spiral"
  | "triple_circle"
  | "triangle_slash"
  | "lightning"
  | "chevron"
  | "cross"
  | "wave";

export interface SpellCastingGesturePoint {
  x: number;
  y: number;
  t?: number;
}

export interface SpellCastingSpellModel {
  id: SpellCastingSpellId;
  label: string;
  description: string;
  color: SpellCastingGestureColor;
  shape: SpellCastingGestureShape;
  iconPath: string;
  manaCost: number;
  cooldownMs: number;
  cooldownRemainingMs: number;
  castMs: number;
  disabled: boolean;
}

export interface SpellCastingDuelistModel {
  playerId: string;
  name: string;
  color: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  shieldHp: number;
  shieldRemainingMs: number;
  activeCastLabel?: string;
  lastGesture?: {
    spellLabel: string;
    confidence: number;
    reason: string;
  };
}

export interface SpellCastingLayoutModel {
  kind: "spell_casting";
  title: string;
  subtitle?: string;
  helperText?: string;
  language?: import("@open-party-lab/protocol").SupportedLanguage;
  disabled: boolean;
  ready?: ReadyLayoutModel;
  resetKey: string;
  nextSpellReadyMs: number;
  nextSpellTotalMs: number;
  selectedSpellId: SpellCastingSpellId | null;
  self: SpellCastingDuelistModel | null;
  opponent: SpellCastingDuelistModel | null;
  spells: SpellCastingSpellModel[];
  actionLog: string[];
  onCastGesture: (spellId: SpellCastingSpellId, points: SpellCastingGesturePoint[]) => void;
}

export interface TowerDefenseTowerModel {
  id: string;
  slotId: string;
  towerTypeId: string;
  displayName: string;
  iconPath?: string;
  level: number;
  damage: number;
  range: number;
  fireRateMs: number;
  color: string;
  cooldownRemainingMs: number;
  investedGold: number;
  upgradeCost: number | null;
  sellValue: number;
  slowPct?: number;
  slowDurationMs?: number;
}

export interface TowerDefenseSlotModel {
  id: string;
  col: number;
  row: number;
  tower: TowerDefenseTowerModel | null;
}

export interface TowerDefenseMapCellModel {
  col: number;
  row: number;
}

export interface TowerDefenseMapModel {
  id: string;
  name: string;
  cols: number;
  rows: number;
  pathCells: TowerDefenseMapCellModel[];
  buildSlots: TowerDefenseSlotModel[];
}

export interface TowerDefensePlayerModel {
  playerId: string;
  name: string;
  color: string;
  gold: number;
  incomeTickValue: number;
  incomeTickEveryMs: number;
  lives: number;
  alive: boolean;
  kills: number;
  sends: number;
  leaks: number;
  leakSignalCount?: number;
  outgoingToPlayerId: string | null;
  outgoingToPlayerName: string | null;
}

export interface TowerDefenseCatalogTowerModel {
  id: string;
  displayName: string;
  description: string;
  color: string;
  iconPath?: string;
  cost: number;
  sellRefundRatio: number;
  maxLevel: number;
  baseDamage: number;
  baseRange: number;
  baseFireRateMs: number;
  levels: Array<{
    level: number;
    price: number;
    damage: number;
    range: number;
    fireRateMs: number;
  }>;
}

export interface TowerDefenseCatalogEnemyModel {
  id: string;
  displayName: string;
  description: string;
  color: string;
  iconPath?: string;
  sendCost: number;
  incomeBonus: number;
  maxHp: number;
  speed: number;
  bounty: number;
  damage: number;
}

export interface TowerDefenseLayoutModel {
  kind: "tower_defense";
  title: string;
  subtitle?: string;
  helperText?: string;
  language?: import("@open-party-lab/protocol").SupportedLanguage;
  disabled: boolean;
  buildDisabled: boolean;
  sendDisabled: boolean;
  accentColor?: string;
  resetKey: string;
  currentPlayerId: string;
  currentPlayer: TowerDefensePlayerModel | null;
  nextTargetPlayer: TowerDefensePlayerModel | null;
  map: TowerDefenseMapModel;
  towerCatalog: TowerDefenseCatalogTowerModel[];
  enemyCatalog: TowerDefenseCatalogEnemyModel[];
  players: TowerDefensePlayerModel[];
  onBuild: (slotId: string, towerTypeId: string) => void;
  onUpgrade: (slotId: string) => void;
  onSell: (slotId: string) => void;
  onSend: (enemyTypeId: string) => void;
}

export interface ShopOfferModel {
  id: string;
  kind: "item" | "weapon" | "upgrade";
  title: string;
  description: string;
  cost: number;
  affordable: boolean;
  purchased: boolean;
  iconPath?: string;
  targetLevel?: number;
  summary?: string;
  stats?: LayoutStat[];
  tags?: string[];
  detailLines?: Array<{
    label: string;
    value: string;
  }>;
}

export interface ShopLayoutModel {
  kind: "shop";
  title: string;
  subtitle?: string;
  helperText?: string;
  language?: import("@open-party-lab/protocol").SupportedLanguage;
  disabled: boolean;
  accentColor?: string;
  waveNumber: number;
  materials: number;
  ready?: ReadyLayoutModel;
  reroll?: {
    cost: number;
    count: number;
    affordable: boolean;
    onReroll: () => void;
  };
  loadout?: {
    weapons: Array<{
      weaponInstanceId: string;
      weaponId: string;
      level: number;
      maxLevel: number;
      displayName: string;
      description: string;
      iconPath?: string;
      sellValue?: number;
      sellable?: boolean;
      canCombine?: boolean;
      stats?: LayoutStat[];
    }>;
    items: Array<{
      itemId: string;
      level: number;
      displayName: string;
      description?: string;
      iconPath?: string;
    }>;
  };
  runSummary?: {
    wavesCleared: number;
    totalKills: number;
    totalMaterialsCollected: number;
    totalSurvivedMs: number;
  };
  playerStats?: Array<{
    label: string;
    value: string;
  }>;
  offers: ShopOfferModel[];
  onBuy: (offerId: string) => void;
  onSellWeapon?: (weaponInstanceId: string) => void;
  onCombineWeapon?: (weaponInstanceId: string) => void;
}

export interface ArenaSurvivorModernShopLayoutModel extends Omit<ShopLayoutModel, "kind"> {
  kind: "arena_survivor_modern_shop";
}

export interface DrawingGuessStrokeModel {
  id: string;
  color: string;
  points: Array<{ x: number; y: number }>;
}

export interface DrawingGuessFeedModel {
  playerName: string;
  guess: string;
  correct: boolean;
}

export interface DrawingGuessLayoutModel {
  kind: "drawing_guess";
  title: string;
  subtitle?: string;
  helperText?: string;
  language?: import("@open-party-lab/protocol").SupportedLanguage;
  disabled: boolean;
  ready?: ReadyLayoutModel;
  guessResetKey?: string;
  isDrawer: boolean;
  wordMask: string;
  secretWord?: string;
  currentColor?: string;
  availableColors?: string[];
  strokes: DrawingGuessStrokeModel[];
  guessFeed: DrawingGuessFeedModel[];
  winnerName?: string;
  onDrawStart: (x: number, y: number) => void;
  onDrawMove: (x: number, y: number) => void;
  onDrawEnd: () => void;
  onClearDrawing: () => void;
  onSelectColor?: (color: string) => void;
  onSubmitGuess: (guess: string) => void;
}

export interface SchaetzoramaLayoutModel {
  kind: "schaetzorama";
  title: string;
  subtitle?: string;
  helperText?: string;
  language?: import("@open-party-lab/protocol").SupportedLanguage;
  disabled: boolean;
  ready?: ReadyLayoutModel;
  stage: import("@open-party-lab/protocol").SchaetzoramaStage;
  resetKey: string;
  roundContent?: import("@open-party-lab/protocol").SchaetzoramaRoundContent<import("@open-party-lab/protocol").SchaetzoramaPublicQuestion>;
  ownAnswers: import("@open-party-lab/protocol").SchaetzoramaAnswerSet;
  ownJokerPreview: import("@open-party-lab/protocol").SchaetzoramaJokerPreview | null | undefined;
  ownJoker: import("@open-party-lab/protocol").SchaetzoramaJokerSelection | null | undefined;
  ownInventory: import("@open-party-lab/protocol").SchaetzoramaJokerInventory;
  copyTargets: Array<{
    playerId: string;
    name: string;
    answers?: import("@open-party-lab/protocol").SchaetzoramaAnswerSet;
  }>;
  progress: import("@open-party-lab/protocol").SchaetzoramaPlayerProgress[];
  answerEndsAt: number | null;
  jokerEndsAt: number | null;
  solutions: import("@open-party-lab/protocol").SchaetzoramaAnswerSet;
  results: import("@open-party-lab/protocol").SchaetzoramaPlayerRoundResult[];
  standings: import("@open-party-lab/protocol").SchaetzoramaStanding[];
  categoryLabels: Record<import("@open-party-lab/protocol").SchaetzoramaCategoryId, string>;
  canSubmitAnswers: boolean;
  canSubmitJoker: boolean;
  onSubmitAnswers: (answers: import("@open-party-lab/protocol").SchaetzoramaAnswerSet) => void;
  onPreviewJoker: (joker: import("@open-party-lab/protocol").SchaetzoramaJokerSelection) => void;
  onChooseJoker: (joker: import("@open-party-lab/protocol").SchaetzoramaJokerSelection | null) => void;
}

export interface WordTilesLayoutModel {
  kind: "word_tiles_board";
  title: string;
  subtitle?: string;
  helperText?: string;
  language?: import("@open-party-lab/protocol").SupportedLanguage;
  disabled: boolean;
  canAct: boolean;
  ready?: ReadyLayoutModel;
  resetKey: string;
  boardSize: number;
  board: import("@open-party-lab/protocol").WordTilesBoardCellState[];
  rack: import("@open-party-lab/protocol").WordTilesRackTileState[];
  players: import("@open-party-lab/protocol").WordTilesPlayerPublicState[];
  currentPlayerId: string;
  activePlayerId: string | null;
  activePlayerName: string | null;
  bagCount: number;
  moveNumber: number;
  ownScore: number;
  lastMove?: import("@open-party-lab/protocol").WordTilesMoveSummaryState;
  lastError?: string;
  tileValues: Record<string, number>;
  onPlay: (placements: import("@open-party-lab/protocol").WordTilesPlacementState[]) => void;
  onPass: () => void;
  onExchange: (tileIds: string[]) => void;
}

export interface MagicArenaLayoutModel {
  kind: "magic_arena";
  title: string;
  subtitle?: string;
  helperText?: string;
  language?: import("@open-party-lab/protocol").SupportedLanguage;
  disabled: boolean;
  ready?: ReadyLayoutModel;
  resetKey: string;
  currentPlayerId: string;
  state: any;
  onPlanSlot: (slotIndex: number, action: any | null) => void;
  onReady: () => void;
}

export type ControllerLayoutModel =
  | SingleButtonLayoutModel
  | ChoiceLayoutModel
  | TapMashLayoutModel
  | LeftRightHoldLayoutModel
  | DPadLayoutModel
  | VirtualJoystickLayoutModel
  | RacingControlsLayoutModel
  | ChaosKommandoLayoutModel
  | TwinStickLayoutModel
  | SpellCastingLayoutModel
  | TowerDefenseLayoutModel
  | ShopLayoutModel
  | ArenaSurvivorModernShopLayoutModel
  | DrawingGuessLayoutModel
  | SchaetzoramaLayoutModel
  | WordTilesLayoutModel
  | MagicArenaLayoutModel;

// TODO: Fuer spaetere Minispiele hier weitere Layout-Modelle wie Choice und Swipe ergaenzen.
