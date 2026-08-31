import { useEffect, useMemo, useState } from "react";
import { useHaptics } from "../../hooks/useHaptics.js";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { WordTilesLayoutModel } from "./models.js";
import type { WordTilesBoardCellState, WordTilesRackTileState } from "@open-party-lab/protocol";

interface WordTilesLayoutProps {
  model: WordTilesLayoutModel;
}

interface DraftPlacement {
  x: number;
  y: number;
  tile: WordTilesRackTileState;
  letter: string;
}

const baseBlankLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function blankLettersFor(en: boolean): string[] {
  return (en ? baseBlankLetters : `${baseBlankLetters}ÄÖÜ`).split("");
}

function keyFor(x: number, y: number): string {
  return `${x}:${y}`;
}

function bonusLabel(bonus: WordTilesBoardCellState["bonus"]): string {
  switch (bonus) {
    case "double_letter":
      return "2L";
    case "triple_letter":
      return "3L";
    case "double_word":
      return "2W";
    case "triple_word":
      return "3W";
    case "center":
      return "*";
    default:
      return "";
  }
}

function bonusColors(bonus: WordTilesBoardCellState["bonus"]): { background: string; color: string; border: string } {
  switch (bonus) {
    case "double_letter":
      return { background: "color-mix(in srgb, var(--accent) 28%, transparent)", color: "var(--ink)", border: "color-mix(in srgb, var(--accent) 45%, transparent)" };
    case "triple_letter":
      return { background: "color-mix(in srgb, var(--accent) 44%, transparent)", color: "var(--ink)", border: "color-mix(in srgb, var(--accent) 58%, transparent)" };
    case "double_word":
    case "center":
      return { background: "color-mix(in srgb, var(--accent) 24%, transparent)", color: "var(--ink)", border: "color-mix(in srgb, var(--accent) 42%, transparent)" };
    case "triple_word":
      return { background: "color-mix(in srgb, var(--danger) 38%, transparent)", color: "var(--ink)", border: "color-mix(in srgb, var(--danger) 58%, transparent)" };
    default:
      return { background: "color-mix(in srgb, var(--surface) 78%, transparent)", color: "color-mix(in srgb, var(--ink-soft) 50%, transparent)", border: "color-mix(in srgb, var(--muted) 13%, transparent)" };
  }
}

function hasBoardTiles(cells: WordTilesBoardCellState[]): boolean {
  return cells.some((cell) => cell.tile);
}

function isAdjacentToBoardTile(
  cellsByKey: Map<string, WordTilesBoardCellState>,
  x: number,
  y: number
): boolean {
  return [
    cellsByKey.get(keyFor(x - 1, y)),
    cellsByKey.get(keyFor(x + 1, y)),
    cellsByKey.get(keyFor(x, y - 1)),
    cellsByKey.get(keyFor(x, y + 1))
  ].some((cell) => cell?.tile);
}

function resolveDraftOrientation(draft: DraftPlacement[]): "horizontal" | "vertical" | "open" {
  if (draft.length < 2) {
    return "open";
  }

  if (draft.every((entry) => entry.y === draft[0].y)) {
    return "horizontal";
  }

  if (draft.every((entry) => entry.x === draft[0].x)) {
    return "vertical";
  }

  return "open";
}

function scoreTile(tile: WordTilesRackTileState, letter: string): string {
  return tile.isBlank ? `${letter}·` : `${tile.score}`;
}

export function WordTilesLayout({ model }: WordTilesLayoutProps) {
  const haptics = useHaptics();
  const en = model.language === "en";
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPlacement[]>([]);
  const [exchangeMode, setExchangeMode] = useState(false);
  const [exchangeTileIds, setExchangeTileIds] = useState<string[]>([]);
  const [pendingBlank, setPendingBlank] = useState<{ tile: WordTilesRackTileState; x: number; y: number } | null>(null);

  useEffect(() => {
    setSelectedTileId(null);
    setDraft([]);
    setExchangeMode(false);
    setExchangeTileIds([]);
    setPendingBlank(null);
  }, [model.resetKey]);

  const cellsByKey = useMemo(
    () => new Map(model.board.map((cell) => [keyFor(cell.x, cell.y), cell] as const)),
    [model.board]
  );
  const draftByKey = useMemo(
    () => new Map(draft.map((entry) => [keyFor(entry.x, entry.y), entry] as const)),
    [draft]
  );
  const draftTileIds = useMemo(() => new Set(draft.map((entry) => entry.tile.id)), [draft]);
  const boardHasTiles = useMemo(() => hasBoardTiles(model.board), [model.board]);
  const visibleRack = model.rack.filter((tile) => !draftTileIds.has(tile.id));
  const selectedTile = visibleRack.find((tile) => tile.id === selectedTileId) ?? null;
  const draftOrientation = resolveDraftOrientation(draft);

  // Gating: Wo darf ein Stein abgelegt werden? Bewusst locker (nur Linien-
  // Konsistenz) - die vollstaendige Regelpruefung macht der Server beim Legen.
  // So sind auch Zuege moeglich, deren erster Stein noch nicht an einen
  // vorhandenen Stein angrenzt.
  function isPlaceableCell(x: number, y: number): boolean {
    if (!selectedTile || exchangeMode || model.disabled) {
      return false;
    }

    if (draft.length === 0) {
      return true;
    }

    if (draft.length === 1) {
      return x === draft[0].x || y === draft[0].y;
    }

    if (draftOrientation === "horizontal") {
      return y === draft[0].y;
    }

    if (draftOrientation === "vertical") {
      return x === draft[0].x;
    }

    return false;
  }

  // Hervorhebung: Felder, die mit hoher Wahrscheinlichkeit zu einem gueltigen
  // Zug fuehren (Anschluss an vorhandene Steine bzw. der Stern beim ersten Wort).
  function isSuggestedCell(x: number, y: number): boolean {
    if (!isPlaceableCell(x, y)) {
      return false;
    }

    if (draft.length === 0) {
      return boardHasTiles ? isAdjacentToBoardTile(cellsByKey, x, y) : x === 7 && y === 7;
    }

    return true;
  }

  function placeTile(tile: WordTilesRackTileState, x: number, y: number, letter?: string): void {
    setDraft((current) => [...current, { x, y, tile, letter: letter ?? tile.letter }]);
    setSelectedTileId(null);
    haptics.tap(16);
  }

  function handleCellPress(cell: WordTilesBoardCellState): void {
    const draftTile = draftByKey.get(keyFor(cell.x, cell.y));

    if (draftTile) {
      setDraft((current) => current.filter((entry) => !(entry.x === cell.x && entry.y === cell.y)));
      haptics.tap(12);
      return;
    }

    if (cell.tile || !selectedTile || !isPlaceableCell(cell.x, cell.y)) {
      haptics.tap(6);
      return;
    }

    if (selectedTile.isBlank) {
      setPendingBlank({ tile: selectedTile, x: cell.x, y: cell.y });
      return;
    }

    placeTile(selectedTile, cell.x, cell.y);
  }

  function submitDraft(): void {
    if (draft.length === 0 || model.disabled) {
      return;
    }

    model.onPlay(
      draft.map((entry) => ({
        x: entry.x,
        y: entry.y,
        tileId: entry.tile.id,
        letter: entry.letter,
        score: entry.tile.isBlank ? 0 : entry.tile.score,
        isBlank: entry.tile.isBlank
      }))
    );
  }

  function toggleExchangeTile(tileId: string): void {
    setExchangeTileIds((current) =>
      current.includes(tileId)
        ? current.filter((entry) => entry !== tileId)
        : [...current, tileId]
    );
    haptics.tap(12);
  }

  function handleRackPress(tile: WordTilesRackTileState): void {
    if (model.disabled) {
      return;
    }

    if (exchangeMode) {
      toggleExchangeTile(tile.id);
      return;
    }

    setSelectedTileId((current) => (current === tile.id ? null : tile.id));
    haptics.tap(12);
  }

  const sortedPlayers = [...model.players].sort((left, right) => right.score - left.score);
  const currentPlayer = model.players.find((player) => player.playerId === model.currentPlayerId);
  const pendingMove = model.pendingMove;
  const activeTurn = model.activeTurn;
  const pendingMoveWords = pendingMove?.words.map((word) => word.word).join(", ") ?? "";
  const isPendingMoveOwner = pendingMove?.playerId === model.currentPlayerId;
  const acceptedPendingMove = Boolean(pendingMove?.acceptedByPlayerIds.includes(model.currentPlayerId));
  const pendingAcceptCount = pendingMove?.acceptedByPlayerIds.length ?? 0;
  const pendingRequiredCount = pendingMove?.requiredAcceptancePlayerIds.length ?? 0;
  const pendingMoveStatus = pendingMove
    ? pendingMove.challengedByName
      ? en
        ? `Challenged by ${pendingMove.challengedByName}`
        : `Angezweifelt von ${pendingMove.challengedByName}`
      : en
        ? `${pendingAcceptCount}/${pendingRequiredCount} accepted`
        : `${pendingAcceptCount}/${pendingRequiredCount} akzeptiert`
    : "";

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <header
        style={{
          display: "grid",
          gap: 8,
          padding: 12,
          borderRadius: 16,
          border: "1px solid var(--panel-border)",
          background: "linear-gradient(180deg, color-mix(in srgb, var(--surface) 90%, transparent), color-mix(in srgb, var(--accent-soft) 72%, transparent))"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
          <strong style={{ fontSize: "1.18rem", color: "var(--accent)" }}>{model.title}</strong>
          <span style={{ color: "var(--text-muted)", fontWeight: 800 }}>{model.ownScore} P</span>
        </div>
        <span style={{ color: "var(--text-muted)", lineHeight: 1.35 }}>{model.subtitle}</span>
        <span style={{ color: model.lastError ? "var(--danger-soft)" : "var(--text-muted)", lineHeight: 1.35 }}>
          {model.lastError ?? model.helperText}
        </span>
      </header>

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 6
        }}
      >
        <div style={metricStyle}>
          <span style={metricLabelStyle}>{en ? "Bag" : "Beutel"}</span>
          <strong>{model.bagCount}</strong>
        </div>
        <div style={metricStyle}>
          <span style={metricLabelStyle}>{en ? "Move" : "Zug"}</span>
          <strong>{model.moveNumber + 1}</strong>
        </div>
        <div style={metricStyle}>
          <span style={metricLabelStyle}>{en ? "Rack" : "Rack"}</span>
          <strong>{currentPlayer?.rackCount ?? model.rack.length}</strong>
        </div>
        <div style={metricStyle}>
          <span style={metricLabelStyle}>{en ? "Turn" : "Zug"}</span>
          <strong>{activeTurn?.score ?? 0}</strong>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 6,
          padding: 7,
          borderRadius: 14,
          border: "1px solid color-mix(in srgb, var(--muted) 14%, transparent)",
          background: "color-mix(in srgb, var(--paper) 52%, transparent)"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${model.boardSize}, minmax(0, 1fr))`,
            gap: 2,
            aspectRatio: "1 / 1",
            touchAction: "manipulation"
          }}
        >
          {model.board.map((cell) => {
            const draftTile = draftByKey.get(keyFor(cell.x, cell.y));
            const renderedTile = draftTile
              ? {
                  letter: draftTile.letter,
                  score: draftTile.tile.isBlank ? 0 : draftTile.tile.score,
                  isBlank: draftTile.tile.isBlank,
                  draft: true
                }
              : cell.tile
                ? {
                    letter: cell.tile.letter,
                    score: cell.tile.score,
                    isBlank: cell.tile.isBlank,
                    draft: false
                  }
                : null;
            const colors = bonusColors(cell.bonus);
            const eligible = !renderedTile && isSuggestedCell(cell.x, cell.y);

            return (
              <button
                key={keyFor(cell.x, cell.y)}
                type="button"
                disabled={model.disabled && !draftTile}
                onClick={() => handleCellPress(cell)}
                style={{
                  position: "relative",
                  minWidth: 0,
                  aspectRatio: "1 / 1",
                  borderRadius: 4,
                  border: renderedTile
                    ? cell.recent || renderedTile.draft
                      ? "2px solid var(--amber)"
                      : "1px solid color-mix(in srgb, var(--amber) 62%, transparent)"
                    : eligible
                      ? "2px solid color-mix(in srgb, var(--sage) 72%, transparent)"
                      : `1px solid ${colors.border}`,
                  background: renderedTile
                    ? renderedTile.draft
                      ? "linear-gradient(180deg, var(--amber-soft), var(--amber))"
                      : "linear-gradient(180deg, var(--amber-soft), var(--amber))"
                    : eligible
                      ? "color-mix(in srgb, var(--sage) 22%, transparent)"
                      : colors.background,
                  color: renderedTile ? "var(--amber)" : colors.color,
                  padding: 0,
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                  opacity: model.disabled && !draftTile ? 0.72 : 1
                }}
              >
                {renderedTile ? (
                  <>
                    <span style={{ fontSize: "clamp(0.62rem, 2.5vw, 1rem)", fontWeight: 950, lineHeight: 1 }}>
                      {renderedTile.letter}
                    </span>
                    <span
                      style={{
                        position: "absolute",
                        right: 2,
                        bottom: 1,
                        fontSize: "0.48rem",
                        fontWeight: 900,
                        opacity: 0.82
                      }}
                    >
                      {renderedTile.score}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: "0.46rem", fontWeight: 900, lineHeight: 1 }}>{bonusLabel(cell.bonus)}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <strong>{exchangeMode ? (en ? "Exchange tiles" : "Steine tauschen") : (en ? "Your rack" : "Dein Rack")}</strong>
          <span style={{ color: "var(--text-muted)" }}>
            {draft.length > 0 ? `${draft.length}/7` : exchangeMode ? `${exchangeTileIds.length}` : selectedTile?.letter ?? "-"}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}>
          {visibleRack.map((tile) => {
            const selected = selectedTileId === tile.id;
            const exchangeSelected = exchangeTileIds.includes(tile.id);

            return (
              <button
                key={tile.id}
                type="button"
                disabled={model.disabled}
                onClick={() => handleRackPress(tile)}
                style={{
                  position: "relative",
                  minHeight: 52,
                  borderRadius: 8,
                  border: exchangeSelected
                    ? "2px solid var(--amber)"
                    : selected
                      ? "2px solid var(--sage)"
                      : "1px solid color-mix(in srgb, var(--amber) 70%, transparent)",
                  background: exchangeSelected
                    ? "linear-gradient(180deg, var(--amber-soft), var(--amber))"
                    : selected
                      ? "linear-gradient(180deg, var(--sage-soft), var(--sage))"
                      : "linear-gradient(180deg, var(--amber-soft), var(--amber))",
                  color: "var(--amber)",
                  fontWeight: 950,
                  fontSize: "1.25rem",
                  opacity: model.disabled ? 0.58 : 1
                }}
              >
                {tile.isBlank ? "?" : tile.letter}
                <span
                  style={{
                    position: "absolute",
                    right: 6,
                    bottom: 4,
                    fontSize: "0.58rem",
                    fontWeight: 900
                  }}
                >
                  {scoreTile(tile, tile.letter)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {activeTurn ? (
        <section
          style={{
            display: "grid",
            gap: 5,
            padding: 9,
            borderRadius: 14,
            border: "1px solid color-mix(in srgb, var(--sage) 28%, transparent)",
            background: "color-mix(in srgb, var(--sage-strong) 20%, transparent)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
            <strong>{en ? "This turn" : "Dieser Zug"}</strong>
            <span style={{ color: "var(--ink-soft)", fontWeight: 900 }}>
              {activeTurn.score} P
              {activeTurn.bingoEligible ? " +50" : ""}
            </span>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "0.84rem", lineHeight: 1.35 }}>
            {activeTurn.acceptedMoveCount} {en ? "accepted placement(s)" : "akzeptierte Abschnitt(e)"}
            {activeTurn.words.length > 0 ? ` | ${activeTurn.words.map((word) => word.word).join(", ")}` : ""}
          </span>
        </section>
      ) : null}

      {pendingMove ? (
        <section
          style={{
            display: "grid",
            gap: 8,
            padding: 10,
            borderRadius: 14,
            border: pendingMove.challengedByName ? "1px solid color-mix(in srgb, var(--danger) 45%, transparent)" : "1px solid color-mix(in srgb, var(--amber) 34%, transparent)",
            background: pendingMove.challengedByName ? "color-mix(in srgb, var(--danger) 28%, transparent)" : "color-mix(in srgb, var(--amber) 24%, transparent)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
            <strong>{en ? "Open move" : "Offener Zug"}</strong>
            <span style={{ color: pendingMove.challengedByName ? "var(--danger-soft)" : "var(--amber-soft)", fontWeight: 850 }}>
              {pendingMoveStatus}
            </span>
          </div>
          <span style={{ color: "var(--text-muted)", lineHeight: 1.35 }}>
            {pendingMove.playerName}: {pendingMove.score} P
            {pendingMoveWords ? ` | ${pendingMoveWords}` : ""}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.84rem", lineHeight: 1.35 }}>
            {isPendingMoveOwner
              ? pendingMove.challengedByName
                ? en
                  ? "Resolve the challenge after checking externally."
                  : "Entscheide nach der externen Pruefung."
                : en
                  ? "Waiting for the other players to accept or challenge."
                  : "Warte auf Akzeptieren oder Anzweifeln der anderen."
              : acceptedPendingMove
                ? en
                  ? "You accepted this placement."
                  : "Du hast diesen Abschnitt akzeptiert."
              : en
                ? "Accept to let the turn continue, or challenge for an external check."
                : "Akzeptiere zum Weiterspielen oder zweifle fuer eine externe Pruefung an."}
          </span>
        </section>
      ) : null}

      {pendingMove ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: isPendingMoveOwner && pendingMove.challengedByName ? "repeat(2, minmax(0, 1fr))" : isPendingMoveOwner ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: 6
          }}
        >
          {isPendingMoveOwner ? (
            <>
              {pendingMove.challengedByName ? (
                <>
                  <button
                    type="button"
                    disabled={!model.canRecallPendingMove}
                    onClick={() => model.onRecallPendingMove(pendingMove.id)}
                    style={dangerButtonStyle}
                  >
                    {en ? "Recall" : "Zuruecknehmen"}
                  </button>
                  <button
                    type="button"
                    disabled={!model.canResolvePendingMove}
                    onClick={() => model.onConfirmPendingMove(pendingMove.id)}
                    style={primaryButtonStyle}
                  >
                    {en ? "Play" : "Legen"}
                  </button>
                </>
              ) : (
                <button type="button" disabled style={secondaryButtonStyle}>
                  {en ? "Waiting" : "Warten"}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!model.canChallenge}
                onClick={() => model.onChallenge(pendingMove.id)}
                style={warningButtonStyle}
              >
                {en ? "Challenge" : "Anzweifeln"}
              </button>
              <button
                type="button"
                disabled={!model.canAcceptPendingMove}
                onClick={() => model.onAcceptPendingMove(pendingMove.id)}
                style={acceptedPendingMove ? secondaryButtonStyle : primaryButtonStyle}
              >
                {acceptedPendingMove ? (en ? "Accepted" : "Akzeptiert") : (en ? "Accept" : "Akzeptieren")}
              </button>
            </>
          )}
        </section>
      ) : (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
          <button type="button" disabled={model.disabled || draft.length === 0} onClick={submitDraft} style={primaryButtonStyle}>
            {en ? "Play" : "Legen"}
          </button>
          <button
            type="button"
            disabled={model.disabled || draft.length === 0}
            onClick={() => {
              setDraft([]);
              setSelectedTileId(null);
            }}
            style={secondaryButtonStyle}
          >
            {en ? "Recall" : "Zurueck"}
          </button>
          <button
            type="button"
            disabled={activeTurn ? !model.canFinishTurn || draft.length > 0 || exchangeMode : !model.canAct || draft.length > 0}
            onClick={() => {
              if (activeTurn) {
                model.onFinishTurn();
                return;
              }

              if (exchangeMode && exchangeTileIds.length > 0) {
                model.onExchange(exchangeTileIds);
                return;
              }

              setExchangeMode((current) => !current);
              setSelectedTileId(null);
              setExchangeTileIds([]);
            }}
            style={activeTurn ? primaryButtonStyle : exchangeMode ? warningButtonStyle : secondaryButtonStyle}
          >
            {activeTurn ? (en ? "Finish" : "Fertig") : exchangeMode ? (en ? "OK" : "OK") : (en ? "Swap" : "Tausch")}
          </button>
          <button type="button" disabled={!model.canAct || Boolean(activeTurn) || draft.length > 0 || exchangeMode} onClick={model.onPass} style={secondaryButtonStyle}>
            {en ? "Pass" : "Pass"}
          </button>
        </section>
      )}

      {model.lastMove ? (
        <section style={{ color: "var(--text-muted)", fontSize: "0.86rem", lineHeight: 1.4 }}>
          <strong style={{ color: "var(--text-main)" }}>{en ? "Last move" : "Letzter Zug"}: </strong>
          {model.lastMove.playerName} {model.lastMove.score > 0 ? `${model.lastMove.score} P` : model.lastMove.reason ?? "0 P"}
          {model.lastMove.words.length > 0 ? ` | ${model.lastMove.words.map((word) => word.word).join(", ")}` : ""}
        </section>
      ) : null}

      <section style={{ display: "grid", gap: 5 }}>
        {sortedPlayers.map((player) => (
          <div
            key={player.playerId}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto auto",
              alignItems: "center",
              gap: 8,
              padding: "7px 9px",
              borderRadius: 10,
              border: player.playerId === model.activePlayerId ? "1px solid color-mix(in srgb, var(--sage) 50%, transparent)" : "1px solid color-mix(in srgb, var(--muted) 12%, transparent)",
              background: player.playerId === model.currentPlayerId ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "color-mix(in srgb, var(--surface) 42%, transparent)"
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{ color: player.color, fontWeight: 900 }}>●</span> {player.name}
            </span>
            <strong>{player.score}</strong>
            <small style={{ color: "var(--text-muted)" }}>{player.rackCount}</small>
          </div>
        ))}
      </section>

      {pendingBlank ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            padding: 16,
            background: "color-mix(in srgb, var(--paper) 72%, transparent)"
          }}
        >
          <div
            style={{
              width: "min(520px, 100%)",
              display: "grid",
              gap: 10,
              padding: 14,
              borderRadius: 16,
              border: "1px solid var(--panel-border)",
              background: "var(--panel-bg)"
            }}
          >
            <strong>{en ? "Blank tile" : "Joker"}</strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}>
              {blankLettersFor(en).map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => {
                    placeTile(pendingBlank.tile, pendingBlank.x, pendingBlank.y, letter);
                    setPendingBlank(null);
                  }}
                  style={secondaryButtonStyle}
                >
                  {letter}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setPendingBlank(null)} style={secondaryButtonStyle}>
              {en ? "Cancel" : "Abbrechen"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const metricStyle = {
  display: "grid",
  gap: 2,
  padding: 8,
  borderRadius: 12,
  border: "1px solid color-mix(in srgb, var(--muted) 14%, transparent)",
  background: "color-mix(in srgb, var(--surface) 48%, transparent)"
} as const;

const metricLabelStyle = {
  color: "var(--text-muted)",
  fontSize: "0.74rem",
  fontWeight: 700
} as const;

const primaryButtonStyle = {
  minHeight: 50,
  border: "1px solid color-mix(in srgb, var(--sage) 42%, transparent)",
  borderRadius: 12,
  background: "linear-gradient(180deg, var(--sage-soft), var(--sage))",
  color: "var(--sage-strong)",
  fontWeight: 950
} as const;

const secondaryButtonStyle = {
  minHeight: 50,
  border: "1px solid color-mix(in srgb, var(--muted) 18%, transparent)",
  borderRadius: 12,
  background: "color-mix(in srgb, var(--surface-raised) 78%, transparent)",
  color: "var(--text-main)",
  fontWeight: 850
} as const;

const warningButtonStyle = {
  minHeight: 50,
  border: "1px solid color-mix(in srgb, var(--amber) 45%, transparent)",
  borderRadius: 12,
  background: "linear-gradient(180deg, var(--amber), var(--amber))",
  color: "var(--danger)",
  fontWeight: 950
} as const;

const dangerButtonStyle = {
  minHeight: 50,
  border: "1px solid color-mix(in srgb, var(--danger) 50%, transparent)",
  borderRadius: 12,
  background: "linear-gradient(180deg, var(--danger-soft), var(--danger))",
  color: "var(--danger)",
  fontWeight: 950
} as const;
