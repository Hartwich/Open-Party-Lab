import { useEffect, useRef, useState, type RefObject } from "react";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useOrientationHint } from "../../hooks/useOrientationHint.js";
import { CardBack, PlayingCard } from "./cardArt.js";
import type { CardHandLayoutModel } from "./models.js";
import type {
  CardTableActionState,
  CardTableBackStyle,
  CardTableHandCardState,
  CardTableStackState
} from "@open-party-lab/protocol";

/**
 * Handkarten im Querformat.
 *
 * Das Layout ist bewusst spielunabhängig: Es zeigt die Tischstapel, die das
 * Spiel meldet - einen Ablagestapel, einen Stich, offene Tischkarten oder
 * mehrere Farbreihen -, die eigene Hand und die Aktionen, die der Server für
 * das aktuelle Regelwerk schickt. Die Hand fächert sich so weit auf, wie der
 * Platz reicht: von drei bis über zwanzig Karten bleibt jede antippbar.
 */

interface CardHandLayoutProps {
  model: CardHandLayoutModel;
}

const maxCardHeight = 190;
const minCardHeight = 88;
const stackCardWidth = 40;

function useBoxSize(): [RefObject<HTMLDivElement | null>, { width: number; height: number }] {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const update = () => setSize({ width: element.clientWidth, height: element.clientHeight });

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

function actionColors(kind: CardTableActionState["kind"]): { background: string; color: string; border: string } {
  switch (kind) {
    case "primary":
      return { background: "var(--accent)", color: "var(--on-accent)", border: "var(--accent-strong)" };
    case "danger":
      return { background: "var(--danger)", color: "var(--on-accent)", border: "var(--danger)" };
    default:
      return { background: "var(--surface)", color: "var(--ink)", border: "var(--line-strong)" };
  }
}

/** Ein Tischstapel: verdeckter Stapel mit Zahl, oder bis zu drei offene Karten. */
function TableStack({
  stack,
  backStyle
}: {
  stack: CardTableStackState;
  backStyle: CardTableBackStyle;
}) {
  const cards = stack.cards.slice(0, 3);

  return (
    <div style={{ display: "grid", gap: 3, justifyItems: "center", flex: "0 0 auto" }}>
      <div style={{ display: "flex", gap: 3 }}>
        {stack.faceDown || cards.length === 0 ? (
          stack.count > 0 && stack.faceDown ? (
            <CardBack style={backStyle} width={stackCardWidth} count={stack.count} />
          ) : (
            <div
              style={{
                width: stackCardWidth,
                height: stackCardWidth * 1.4,
                borderRadius: 5,
                border: "1px dashed var(--line-strong)",
                background: "color-mix(in srgb, var(--surface) 70%, transparent)"
              }}
            />
          )
        ) : (
          cards.map((card) => <PlayingCard key={card.cardId} card={card} width={stackCardWidth} />)
        )}
      </div>
      <small
        style={{
          color: "var(--muted)",
          fontSize: "0.68rem",
          maxWidth: stackCardWidth * 3,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
      >
        {stack.label}
        {stack.count > cards.length || stack.faceDown ? ` (${stack.count})` : ""}
      </small>
    </div>
  );
}

export function CardHandLayout({ model }: CardHandLayoutProps) {
  const haptics = useHaptics();
  const orientation = useOrientationHint();
  const en = model.language === "en";
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [choiceCardId, setChoiceCardId] = useState<string | null>(null);
  const [handRef, handBox] = useBoxSize();

  useEffect(() => {
    setSelectedCardId(null);
    setChoiceCardId(null);
  }, [model.resetKey]);

  const hand = model.hand;
  const cardHeight = Math.max(minCardHeight, Math.min(maxCardHeight, (handBox.height || 200) - 26));
  const cardWidth = cardHeight / 1.4;
  const available = Math.max(cardWidth, (handBox.width || 320) - 8);
  const step =
    hand.length > 1 ? Math.min(cardWidth + 8, (available - cardWidth) / (hand.length - 1)) : 0;
  const fanWidth = cardWidth + step * Math.max(0, hand.length - 1);
  const selectedCard = hand.find((card) => card.cardId === selectedCardId) ?? null;
  const wideActions = model.actions.length > 5;

  function playCard(card: CardTableHandCardState): void {
    if (!card.playable || model.disabled) {
      haptics.tap(6);
      return;
    }

    if (model.pendingChoiceCardIds.includes(card.cardId) && model.pendingChoice) {
      setChoiceCardId(card.cardId);
      haptics.tap(14);
      return;
    }

    haptics.tap(18);
    model.onPlayCard(card.cardId);
    setSelectedCardId(null);
  }

  function handleCardPress(card: CardTableHandCardState): void {
    if (selectedCardId === card.cardId) {
      playCard(card);
      return;
    }

    setSelectedCardId(card.cardId);
    haptics.tap(10);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto auto minmax(120px, 1fr)",
        gap: 8,
        height: "100%",
        minHeight: "min(84dvh, 760px)",
        padding: 8,
        background:
          "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--sage) 26%, var(--paper)) 0%, var(--paper) 70%)",
        borderRadius: 16
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          padding: "6px 10px",
          borderRadius: 12,
          border: "1px solid var(--line)",
          background: "var(--surface)"
        }}
      >
        <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>{model.title}</strong>
        <span style={{ color: "var(--muted)", fontSize: "0.86rem" }}>{model.subtitle}</span>
        {model.privateNote ? (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 999,
              background: "var(--sage-soft)",
              color: "var(--ink)",
              fontWeight: 600,
              fontSize: "0.84rem"
            }}
          >
            {model.privateNote}
          </span>
        ) : null}
        {model.conditionLabel ? (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--ink)",
              fontWeight: 600,
              fontSize: "0.84rem"
            }}
          >
            {model.conditionSymbol ? `${model.conditionSymbol} ` : ""}
            {model.conditionLabel}
          </span>
        ) : null}
        <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "0.8rem" }}>
          {model.direction === 1 ? "→" : "←"} #{model.turnNumber}
        </span>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 10, alignItems: "start" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", overflowX: "auto", maxWidth: "58vw" }}>
          {model.stacks.map((stack) => (
            <TableStack key={stack.id} stack={stack} backStyle={model.backStyle} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignContent: "flex-start" }}>
          {model.seats.map((seat) => (
            <div
              key={seat.playerId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 9px",
                borderRadius: 999,
                border: seat.isActive ? "2px solid var(--accent)" : "1px solid var(--line)",
                background:
                  seat.playerId === model.currentPlayerId
                    ? "var(--surface-raised)"
                    : "color-mix(in srgb, var(--surface) 72%, transparent)",
                opacity: seat.connected ? 1 : 0.55,
                fontSize: "0.82rem"
              }}
            >
              <span style={{ color: seat.color, fontSize: "0.8rem" }}>●</span>
              <span style={{ maxWidth: 92, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {seat.name}
              </span>
              <strong>{seat.handCount}</strong>
              {seat.statusLabel ? (
                <span style={{ color: "var(--accent-strong)", fontWeight: 700 }}>{seat.statusLabel}</span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: `minmax(0, 1fr) ${wideActions ? 196 : 138}px`,
          gap: 8,
          minHeight: 0
        }}
      >
        <div
          ref={handRef}
          style={{
            position: "relative",
            minHeight: 0,
            borderRadius: 14,
            border: "1px solid var(--line)",
            background: "color-mix(in srgb, var(--surface) 60%, transparent)",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 8,
              transform: "translateX(-50%)",
              width: fanWidth,
              height: cardHeight + 14
            }}
          >
            {hand.map((card, index) => {
              const selected = card.cardId === selectedCardId;

              return (
                <button
                  key={card.cardId}
                  type="button"
                  onClick={() => handleCardPress(card)}
                  aria-label={`${card.rankLabel} ${card.suitLabel}`}
                  style={{
                    position: "absolute",
                    left: index * step,
                    bottom: selected ? 14 : 0,
                    width: cardWidth,
                    height: cardHeight,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    borderRadius: cardWidth * 0.08,
                    filter: selected
                      ? "drop-shadow(0 10px 16px color-mix(in srgb, var(--shadow-color) 32%, transparent))"
                      : "drop-shadow(0 3px 6px color-mix(in srgb, var(--shadow-color) 16%, transparent))",
                    transition: "bottom 120ms ease",
                    touchAction: "manipulation",
                    zIndex: selected ? 50 : index
                  }}
                >
                  <PlayingCard
                    card={card}
                    width={cardWidth}
                    selected={selected}
                    dimmed={!card.playable && !model.disabled}
                  />
                </button>
              );
            })}
            {hand.length === 0 ? (
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  color: "var(--muted)"
                }}
              >
                {en ? "No cards left." : "Keine Karten mehr."}
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ display: "grid", gap: 6, alignContent: "start", minHeight: 0, overflowY: "auto" }}>
          <button
            type="button"
            disabled={!selectedCard || !selectedCard.playable || model.disabled}
            onClick={() => selectedCard && playCard(selectedCard)}
            style={{
              minHeight: 54,
              borderRadius: 12,
              border: "1px solid var(--sage-strong)",
              background: selectedCard?.playable && !model.disabled ? "var(--sage)" : "var(--surface-muted)",
              color: selectedCard?.playable && !model.disabled ? "var(--on-accent)" : "var(--muted)",
              fontWeight: 700,
              touchAction: "manipulation"
            }}
          >
            {en ? "Play" : "Legen"}
          </button>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: wideActions ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
              gap: 6
            }}
          >
            {model.actions.map((action) => {
              const colors = actionColors(action.kind);

              return (
                <button
                  key={action.id}
                  type="button"
                  disabled={!action.enabled}
                  onClick={() => {
                    haptics.tap(14);
                    setSelectedCardId(null);
                    model.onAction(action.id);
                  }}
                  style={{
                    minHeight: wideActions ? 44 : 50,
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    background: action.enabled ? colors.background : "var(--surface-muted)",
                    color: action.enabled ? colors.color : "var(--muted)",
                    fontWeight: 700,
                    fontSize: wideActions ? "0.86rem" : "1rem",
                    touchAction: "manipulation"
                  }}
                >
                  {action.label}
                </button>
              );
            })}
          </div>

          <small
            style={{
              color: model.lastError ? "var(--danger)" : "var(--muted)",
              lineHeight: 1.3,
              fontSize: "0.76rem"
            }}
          >
            {selectedCard && !selectedCard.playable && selectedCard.hint
              ? selectedCard.hint
              : model.helperText}
          </small>
        </div>
      </section>

      {orientation === "portrait" ? (
        <div
          style={{
            position: "fixed",
            left: 12,
            right: 12,
            bottom: 12,
            padding: "8px 12px",
            borderRadius: 12,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            textAlign: "center",
            color: "var(--muted)",
            zIndex: 60
          }}
        >
          {en ? "Turn your phone sideways." : "Halte dein Handy quer."}
        </div>
      ) : null}

      {choiceCardId && model.pendingChoice ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            display: "grid",
            placeItems: "center",
            padding: 16,
            background: "color-mix(in srgb, var(--ink) 55%, transparent)"
          }}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              display: "grid",
              gap: 10,
              padding: 14,
              borderRadius: 16,
              border: "1px solid var(--line)",
              background: "var(--surface)"
            }}
          >
            <strong>{model.pendingChoice.label}</strong>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, model.pendingChoice.options.length))}, minmax(0, 1fr))`,
                gap: 8
              }}
            >
              {model.pendingChoice.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    haptics.tap(18);
                    model.onPlayCard(choiceCardId, option.id);
                    setChoiceCardId(null);
                    setSelectedCardId(null);
                  }}
                  style={{
                    minHeight: 68,
                    borderRadius: 12,
                    border: "1px solid var(--line-strong)",
                    background: "var(--surface-raised)",
                    color: "var(--ink)",
                    fontWeight: 700,
                    fontSize: "1.05rem"
                  }}
                >
                  <div style={{ fontSize: "1.5rem" }}>{option.symbol}</div>
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setChoiceCardId(null)}
              style={{
                minHeight: 46,
                borderRadius: 12,
                border: "1px solid var(--line-strong)",
                background: "var(--surface-muted)",
                color: "var(--ink)",
                fontWeight: 600
              }}
            >
              {en ? "Cancel" : "Abbrechen"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
