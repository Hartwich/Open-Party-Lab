import { useHaptics } from "../../hooks/useHaptics.js";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { CardHandLayoutModel } from "./models.js";

const symbolPositions: ReadonlyArray<readonly [number, number, number]> = [
  [22, 15, 23], [75, 17, 19], [49, 40, 37], [19, 62, 20],
  [80, 61, 30], [43, 87, 20], [74, 114, 20], [22, 127, 20],
  [49, 11, 16], [49, 108, 17]
];

function SymbolImage({ symbolId }: { symbolId: string }) {
  const cell = Math.max(0, Math.min(90, Number.parseInt(symbolId, 10) || 0));
  return (
    <img src={`/card-table/symboljagd-icons/${String(cell).padStart(2, "0")}.png`} alt="" draggable={false} style={{ display: "block", width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", userSelect: "none" }} />
  );
}

export function SymboljagdLayout({ model }: { model: CardHandLayoutModel }) {
  const haptics = useHaptics();
  const en = model.language === "en";
  const card = model.hand[0];
  const symbols = card?.symbols ?? [];
  const layoutCount = Math.min(symbols.length, symbolPositions.length);
  const offset = card && layoutCount > 0 ? [...card.cardId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % layoutCount : 0;

  if (model.gameOver) {
    return (
      <div style={{ display: "grid", gap: 10, placeItems: "center", minHeight: "70dvh", padding: 18, textAlign: "center" }}>
        <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
          {model.winnerName ? `${en ? "Winner" : "Sieger"}: ${model.winnerName}` : en ? "Round over" : "Runde vorbei"}
        </strong>
        {model.ready ? <ReadyPanel ready={model.ready} /> : null}
      </div>
    );
  }

  return (
    <main aria-label={en ? "Your picture card" : "Deine Symbolkarte"} style={{
      position: "fixed", inset: 0, zIndex: 20, overflow: "hidden", touchAction: "manipulation",
      background: "radial-gradient(120% 90% at 50% 0%, #f8efd9, #ddcfb5 78%)",
      padding: "max(76px, calc(env(safe-area-inset-top) + 72px)) max(7px, env(safe-area-inset-right)) max(27px, calc(env(safe-area-inset-bottom) + 20px)) max(7px, env(safe-area-inset-left))"
    }}>
      {card ? (
        <section style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", containerType: "size", borderRadius: 24, background: "#fffbf4", border: "1px solid #d7cbb7", boxShadow: "0 12px 36px #4d3b2526" }}>
          <div aria-hidden="true" style={{ position: "absolute", inset: 9, border: "1px solid #eee3d1", borderRadius: 17 }} />
          {symbols.map((symbol, index) => {
            const [cx, cy, size] = symbolPositions[(index + offset) % layoutCount]!;
            const choice = model.pendingChoice?.options.find((option) => option.symbolImage === symbol);
            const enabled = Boolean(choice && card.playable && !model.disabled);
            return (
              <button key={`${card.cardId}-${symbol}`} type="button" aria-label={choice?.label ?? (en ? "Picture" : "Symbol")} disabled={!enabled}
                onClick={() => { if (!choice) return; haptics.tap(18); model.onPlayCard(card.cardId, choice.id); }}
                style={{ position: "absolute", left: `${cx}%`, top: `${(cy / 140) * 100}%`, transform: "translate(-50%, -50%)", width: `max(54px, min(${size}cqw, ${size * 0.5}cqh))`, aspectRatio: "1", display: "grid", placeItems: "center", padding: 4, border: 0, borderRadius: 18, background: "transparent", cursor: enabled ? "pointer" : "default", filter: enabled ? "drop-shadow(0 2px 3px #392e2020)" : "none", WebkitTapHighlightColor: "transparent" }}>
                <SymbolImage symbolId={symbol} />
              </button>
            );
          })}
          {model.privateNote || model.lastError ? (
            <div role="status" aria-live="polite" style={{ position: "absolute", left: "50%", bottom: 18, transform: "translateX(-50%)", maxWidth: "88%", padding: "8px 15px", borderRadius: 999, background: model.lastError ? "var(--danger)" : "#fffdf8e8", color: model.lastError ? "var(--on-accent)" : "#51483e", boxShadow: "0 2px 12px #392e2020", fontWeight: 700, textAlign: "center" }}>
              {model.lastError ?? model.privateNote}
            </div>
          ) : null}
          {!card.playable && !model.privateNote && !model.lastError ? <div style={{ position: "absolute", inset: 0, background: "#fff8", pointerEvents: "none" }} /> : null}
        </section>
      ) : <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#51483e", textAlign: "center" }}>{en ? "Waiting for the next card…" : "Warte auf die nächste Karte …"}</div>}
    </main>
  );
}
