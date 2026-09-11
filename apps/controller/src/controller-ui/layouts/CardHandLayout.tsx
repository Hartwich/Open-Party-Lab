import { useEffect, useRef, useState, type RefObject } from "react";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useOrientationHint } from "../../hooks/useOrientationHint.js";
import { PlayingCard } from "./cardArt.js";
import type { CardHandLayoutModel } from "./models.js";
import type { CardTableActionState, CardTableHandCardState } from "@open-party-lab/protocol";

/**
 * Handkarten im Querformat.
 *
 * Das Layout ist bewusst spielunabhängig und zeigt nur, was in die Hand
 * gehört: die eigenen Karten und die Aktionen, die der Server für das aktuelle
 * Regelwerk schickt. Alles Gemeinsame - Tisch, Mitspieler, Spielname,
 * Punktestand - liegt auf dem großen Bildschirm. Es hier zu wiederholen kostet
 * nur Platz, den die Karten besser gebrauchen können, und zwingt den Blick vom
 * Tisch weg aufs Handy.
 *
 * Die Hand fächert sich so weit auf, wie der Platz reicht: von drei bis über
 * zwanzig Karten bleibt jede antippbar. Die Knöpfe liegen darunter, in
 * Daumenreichweite.
 */

interface CardHandLayoutProps {
  model: CardHandLayoutModel;
}

const maxCardHeight = 240;
const minCardHeight = 88;

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
        gridTemplateRows: "minmax(120px, 1fr) auto auto",
        gap: 8,
        height: "100%",
        minHeight: "min(84dvh, 760px)",
        padding: 8,
        background:
          "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--sage) 26%, var(--paper)) 0%, var(--paper) 70%)",
        borderRadius: 16
      }}
    >
      <section style={{ display: "grid", gap: 8, minHeight: 0 }}>
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
                    style={model.cardStyle}
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
      </section>
      {/* Die Knöpfe liegen unter dem Blatt, dort wo der Daumen ohnehin ist. */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch", gap: 6 }}>
        <button
          type="button"
          disabled={!selectedCard || !selectedCard.playable || model.disabled}
          onClick={() => selectedCard && playCard(selectedCard)}
          style={{
            flex: "0 0 auto",
            minWidth: 120,
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

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: "1 1 auto" }}>
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
                  flex: "1 1 120px",
                  minHeight: 54,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  background: action.enabled ? colors.background : "var(--surface-muted)",
                  color: action.enabled ? colors.color : "var(--muted)",
                  fontWeight: 700,
                  fontSize: wideActions ? "0.9rem" : "1rem",
                  touchAction: "manipulation"
                }}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          minHeight: 20,
          color: model.lastError ? "var(--danger)" : "var(--muted)",
          fontSize: "0.78rem",
          lineHeight: 1.3
        }}
      >
        {model.privateNote ? (
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>{model.privateNote}</span>
        ) : null}
        {model.conditionLabel ? (
          <span
            style={{
              padding: "2px 9px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--ink)",
              fontWeight: 600
            }}
          >
            {model.conditionSymbol ? `${model.conditionSymbol} ` : ""}
            {model.conditionLabel}
          </span>
        ) : null}
        <span>
            {selectedCard && !selectedCard.playable && selectedCard.hint
              ? selectedCard.hint
              : model.helperText}
        </span>
      </div>

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
