/**
 * Kartentisch-Layoutvertrag.
 *
 * Diese Typen beschreiben, was die Plattform für ein Kartenspiel rendert:
 * eine Hand im Querformat, den gemeinsamen Tisch und die Aktionsleiste.
 * Sie sind bewusst spielunabhängig - jedes Kartenspiel liefert dieselbe Form
 * und bekommt dieselbe Oberfläche. Die Spielrepos halten eine identische Kopie
 * in ihrem eigenen `protocol`-Entrypoint.
 */

export type CardTableColor = "red" | "black" | "green" | "blue" | "yellow" | "neutral";

export type CardTableBackStyle = "classic" | "diamond" | "wave" | "grid";

export interface CardTableCardState {
  cardId: string;
  suitId: string | null;
  suitSymbol: string;
  suitLabel: string;
  rankLabel: string;
  color: CardTableColor;
  centerLabel?: string;
  points?: number;
}

export interface CardTableHandCardState extends CardTableCardState {
  playable: boolean;
  hint?: string;
}

export type CardTableStackKind = "draw" | "discard" | "zone";

export interface CardTableStackState {
  id: string;
  label: string;
  kind: CardTableStackKind;
  count: number;
  cards: CardTableCardState[];
  faceDown: boolean;
}

export interface CardTableSeatState {
  playerId: string;
  name: string;
  color: string;
  connected: boolean;
  handCount: number;
  score: number;
  isActive: boolean;
  statusLabel?: string;
}

export type CardTableActionKind = "primary" | "secondary" | "danger";

export interface CardTableActionState {
  id: string;
  label: string;
  kind: CardTableActionKind;
  enabled: boolean;
  hint?: string;
}

export interface CardTableChoiceOptionState {
  id: string;
  label: string;
  symbol?: string;
  color?: CardTableColor;
}

export interface CardTableChoiceState {
  id: string;
  label: string;
  options: CardTableChoiceOptionState[];
}

export interface CardTableLogEntryState {
  id: string;
  playerName: string | null;
  text: string;
}
