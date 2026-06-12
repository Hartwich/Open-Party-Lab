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

const blankLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ".split("");

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
      return { background: "rgba(59, 130, 246, 0.28)", color: "#bfdbfe", border: "rgba(96, 165, 250, 0.45)" };
    case "triple_letter":
      return { background: "rgba(14, 165, 233, 0.44)", color: "#e0f2fe", border: "rgba(125, 211, 252, 0.58)" };
    case "double_word":
    case "center":
      return { background: "rgba(244, 114, 182, 0.24)", color: "#fbcfe8", border: "rgba(244, 114, 182, 0.42)" };
    case "triple_word":
      return { background: "rgba(239, 68, 68, 0.38)", color: "#fee2e2", border: "rgba(248, 113, 113, 0.58)" };
    default:
      return { background: "rgba(15, 23, 42, 0.78)", color: "rgba(226, 232, 240, 0.5)", border: "rgba(148, 163, 184, 0.13)" };
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

  function isEligibleEmptyCell(x: number, y: number): boolean {
    if (!selectedTile || exchangeMode || model.disabled) {
      return false;
    }

    if (draft.length === 0) {
      return boardHasTiles ? isAdjacentToBoardTile(cellsByKey, x, y) : x === 7 && y === 7;
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

    if (cell.tile || !selectedTile || !isEligibleEmptyCell(cell.x, cell.y)) {
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
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(8, 47, 73, 0.72))"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
          <strong style={{ fontSize: "1.18rem", color: "var(--accent)" }}>{model.title}</strong>
          <span style={{ color: "var(--text-muted)", fontWeight: 800 }}>{model.ownScore} P</span>
        </div>
        <span style={{ color: "var(--text-muted)", lineHeight: 1.35 }}>{model.subtitle}</span>
        <span style={{ color: model.lastError ? "#fca5a5" : "var(--text-muted)", lineHeight: 1.35 }}>
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
          border: "1px solid rgba(148, 163, 184, 0.14)",
          background: "rgba(2, 6, 23, 0.52)"
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
            const eligible = !renderedTile && isEligibleEmptyCell(cell.x, cell.y);

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
                      ? "2px solid #facc15"
                      : "1px solid rgba(120, 53, 15, 0.62)"
                    : eligible
                      ? "2px solid rgba(34, 197, 94, 0.72)"
                      : `1px solid ${colors.border}`,
                  background: renderedTile
                    ? renderedTile.draft
                      ? "linear-gradient(180deg, #fde68a, #f59e0b)"
                      : "linear-gradient(180deg, #f5deb3, #d6a65c)"
                    : eligible
                      ? "rgba(34, 197, 94, 0.22)"
                      : colors.background,
                  color: renderedTile ? "#3b2208" : colors.color,
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
                    ? "2px solid #fb923c"
                    : selected
                      ? "2px solid #22c55e"
                      : "1px solid rgba(120, 53, 15, 0.7)",
                  background: exchangeSelected
                    ? "linear-gradient(180deg, #fed7aa, #fb923c)"
                    : selected
                      ? "linear-gradient(180deg, #bbf7d0, #22c55e)"
                      : "linear-gradient(180deg, #f5deb3, #d6a65c)",
                  color: "#3b2208",
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
            border: "1px solid rgba(34, 197, 94, 0.28)",
            background: "rgba(20, 83, 45, 0.2)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
            <strong>{en ? "This turn" : "Dieser Zug"}</strong>
            <span style={{ color: "#86efac", fontWeight: 900 }}>
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
            border: pendingMove.challengedByName ? "1px solid rgba(248, 113, 113, 0.45)" : "1px solid rgba(250, 204, 21, 0.34)",
            background: pendingMove.challengedByName ? "rgba(127, 29, 29, 0.28)" : "rgba(120, 53, 15, 0.24)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
            <strong>{en ? "Open move" : "Offener Zug"}</strong>
            <span style={{ color: pendingMove.challengedByName ? "#fca5a5" : "#fde68a", fontWeight: 850 }}>
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
              border: player.playerId === model.activePlayerId ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid rgba(148, 163, 184, 0.12)",
              background: player.playerId === model.currentPlayerId ? "rgba(14, 165, 233, 0.14)" : "rgba(15, 23, 42, 0.42)"
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
            background: "rgba(2, 6, 23, 0.72)"
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
              {blankLetters.map((letter) => (
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
  border: "1px solid rgba(148, 163, 184, 0.14)",
  background: "rgba(15, 23, 42, 0.48)"
} as const;

const metricLabelStyle = {
  color: "var(--text-muted)",
  fontSize: "0.74rem",
  fontWeight: 700
} as const;

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

const warningButtonStyle = {
  minHeight: 50,
  border: "1px solid rgba(251, 146, 60, 0.45)",
  borderRadius: 12,
  background: "linear-gradient(180deg, #fdba74, #f97316)",
  color: "#431407",
  fontWeight: 950
} as const;

const dangerButtonStyle = {
  minHeight: 50,
  border: "1px solid rgba(248, 113, 113, 0.5)",
  borderRadius: 12,
  background: "linear-gradient(180deg, #fca5a5, #ef4444)",
  color: "#450a0a",
  fontWeight: 950
} as const;
