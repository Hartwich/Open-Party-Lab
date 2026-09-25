import { useEffect, useMemo, useState } from "react";
import "./DungeonGuildLayout.css";
import { useHaptics } from "../../hooks/useHaptics.js";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { DungeonGuildCardModel, DungeonGuildLayoutModel } from "./models.js";

interface Props { model: DungeonGuildLayoutModel }
type Page = "character" | "cards";

const names: Record<DungeonGuildCardModel["kind"], [string, string]> = {
  monster: ["Monster", "Monster"], curse: ["Fluch", "Curse"], class: ["Klasse", "Class"],
  race: ["Herkunft", "Ancestry"], item: ["Ausrüstung", "Gear"], boost: ["Kampftrick", "Combat trick"], level: ["Stufe", "Level"]
};

function Icon({ name }: { name: "character" | "cards" | "sell" | "equip" | "sword" | "door" }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const shapes = {
    character: <><circle {...p} cx="12" cy="8" r="4" /><path {...p} d="M4 21c.8-4.5 3.3-6.5 8-6.5s7.2 2 8 6.5" /></>,
    cards: <><path {...p} d="m8 4 11 2v14L8 18V4Zm-3 2v13l3 1m4-12 3 1m-3 3 3 1" /></>,
    sell: <><path {...p} d="M12 3v18m4-13c-.5-2-2-3-4-3s-4 1-4 3 1.6 3 4 3 4 1.1 4 3-1.7 3-4 3-3.6-.9-4-3" /></>,
    equip: <><path {...p} d="M8 4h8l3 4-3 2v10H8V10L5 8l3-4Zm1 6h6M10 14h4" /></>,
    sword: <><path {...p} d="m14 3-9 11h6l-1 7 9-12h-6l1-6Z" /></>,
    door: <><path {...p} d="M5 21V4l14-2v19M8 21h13m-6-10h.01" /></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{shapes[name]}</svg>;
}

function Art({ card, className }: { card: DungeonGuildCardModel; className?: string }) {
  return <img className={className} src={card.artPath} alt="" draggable={false} loading="lazy" />;
}

function stats(card: DungeonGuildCardModel, en: boolean): Array<[string, string]> {
  if (card.kind === "monster") return [
    [en ? "Strength" : "Stärke", String(card.level ?? 0)],
    [en ? "Rewards" : "Beute", (card.levelReward ?? 1) + (en ? " level" : " Stufe") + " · " + (card.goldValue ?? 1) + (en ? " cards" : " Karten")],
    [en ? "Escape" : "Flucht", (card.escapeTarget ?? 5) + "+"]
  ];
  if (card.kind === "item") return [
    [en ? "Bonus" : "Bonus", "+" + (card.bonus ?? 0)],
    [en ? "Slot" : "Platz", card.slot ?? "—"],
    [en ? "Value" : "Wert", (card.goldValue ?? 0) + (en ? " gold" : " Gold")]
  ];
  if (card.kind === "boost") return [[en ? "Combat" : "Kampf", "+" + (card.bonus ?? 0)], [en ? "Use" : "Einsatz", en ? "Once per fight" : "Einmal im Kampf"]];
  if (card.kind === "class" || card.kind === "race") return [[en ? "Strength" : "Stärke", "+" + (card.bonus ?? 0)]];
  return [];
}

function Gear({ card, en, equip, sell, canSell }: { card: DungeonGuildCardModel; en: boolean; equip?: () => void; sell?: () => void; canSell: boolean }) {
  const isEquipped = card.equipped !== false;
  return <article className={"dg-phone-gear" + (isEquipped ? " is-equipped" : " is-carried")}>
    <Art card={card} className="dg-phone-gear-art" />
    <div className="dg-phone-gear-copy"><strong>{card.title}</strong><small>{card.kind === "item" ? (isEquipped ? (en ? "Equipped" : "Angelegt") : (en ? "Carried" : "Im Gepäck")) + (card.bonus ? " · +" + card.bonus : "") : names[card.kind][en ? 1 : 0]}</small></div>
    {equip ? <button className="dg-phone-icon-action" type="button" aria-label={isEquipped ? (en ? "Stow gear" : "Ausrüstung ablegen") : (en ? "Equip gear" : "Ausrüstung anlegen")} onClick={equip}><Icon name="equip" /></button> : null}
    {sell ? <button className="dg-phone-sell" type="button" disabled={!canSell} onClick={sell} aria-label={(en ? "Sell " : "Verkaufen ") + card.title}><Icon name="sell" /><span>{card.goldValue ?? 0}</span></button> : null}
  </article>;
}

export function DungeonGuildLayout({ model }: Props) {
  const en = model.language === "en";
  const haptics = useHaptics();
  const [page, setPage] = useState<Page>("cards");
  const [selectedId, setSelectedId] = useState<string | null>(model.hand[0]?.id ?? null);
  const selected = model.hand.find((card) => card.id === selectedId) ?? model.hand[0] ?? null;
  const actions = useMemo(() => new Map(model.actions.map((action) => [action.id, action])), [model.actions]);
  const sellActions = model.actions.filter((action) => action.id.startsWith("sell:"));
  const gearActions = model.actions.filter((action) => action.id.startsWith("gear:"));
  const turnActions = model.actions.filter((action) => !action.id.startsWith("sell:") && !action.id.startsWith("gear:"));
  const stageNames: Record<string, [string, string]> = {
    door: ["Vor der Tür", "At the door"], combat: ["Im Kampf", "In combat"], help: ["Hilfe gesucht", "Help requested"],
    loot: ["Beute", "Loot"], main: ["Zugaktionen", "Turn actions"], finished: ["Abenteuer beendet", "Adventure over"]
  };

  useEffect(() => {
    setSelectedId((id) => model.hand.some((card) => card.id === id) ? id : model.hand[0]?.id ?? null);
  }, [model.hand, model.resetKey]);

  const act = (id: string) => {
    const action = actions.get(id);
    if (!action?.enabled) return;
    haptics.tap(id === "escape" ? 22 : 14);
    model.onAction(id);
  };
  const playSelected = () => {
    if (!selected?.playable || !model.canAct) return;
    haptics.tap(18);
    model.onPlayCard(selected.id);
  };

  if (model.gameOver) return <main className="dg-phone dg-phone-result">
    <span className="dg-phone-result-mark" aria-hidden="true">✦</span>
    <span className="dg-phone-kicker">{en ? "THE DUNGEON IS QUIET" : "DER DUNGEON IST STILL"}</span>
    <h1>{model.winnerName ? (en ? model.winnerName + " wins" : model.winnerName + " gewinnt") : (en ? "The journey ends" : "Das Abenteuer endet")}</h1>
    <p>{en ? "The shared table has the final tally." : "Die Auswertung liegt auf dem großen Tisch."}</p>
    {model.ready ? <ReadyPanel ready={model.ready} /> : null}
  </main>;

  return <main className="dg-phone" key={model.resetKey}>
    <header className="dg-phone-head">
      <div className="dg-phone-brand"><span className="dg-phone-brand-mark" aria-hidden="true">✦</span><div><span className="dg-phone-kicker">DUNGEON-GILDE · {(stageNames[model.stage] ?? [model.stage, model.stage])[en ? 1 : 0]}</span><h1>{model.playerName}</h1></div></div>
      <span className="dg-phone-stage">{model.activePlayerName === model.playerName ? (en ? "Your turn" : "Dein Zug") : (en ? "Turn: " : "Zug: ") + (model.activePlayerName ?? "—")}</span>
    </header>
    <section className="dg-phone-vitals" aria-label={en ? "Character stats" : "Charakterwerte"}>
      <div className="dg-phone-vital"><span className="dg-phone-vital-icon">✧</span><div><span>{en ? "Level" : "Stufe"}</span><strong>{model.ownLevel}<small>/10</small></strong></div></div>
      <div className="dg-phone-vital"><span className="dg-phone-vital-icon">⚔</span><div><span>{en ? "Strength" : "Kampfstärke"}</span><strong>{model.ownStrength}</strong></div></div>
    </section>
    {model.lastError || model.message ? <div className="dg-phone-message" aria-live="polite"><b aria-hidden="true">{model.lastError ? "!" : "✦"}</b><span>{model.lastError ?? model.message}</span></div> : null}
    <section className="dg-phone-content">
      {page === "character" ? <div className="dg-phone-character">
        {model.dead ? <div className="dg-phone-dead">{en ? "Your adventurer returns next turn." : "Deine Figur kehrt im nächsten Zug zurück."}</div> : null}
        <div className="dg-phone-section-title"><span>{en ? "Character" : "Charakter"}</span><small>{model.ownStrength} {en ? "strength" : "Stärke"}</small></div>
        <div className="dg-phone-identity">
          {model.classCard ? <Gear card={model.classCard} en={en} canSell={false} /> : <div className="dg-phone-gear dg-phone-empty-gear"><span>♜</span><strong>{en ? "No class" : "Keine Klasse"}</strong></div>}
          {model.raceCard ? <Gear card={model.raceCard} en={en} canSell={false} /> : <div className="dg-phone-gear dg-phone-empty-gear"><span>◇</span><strong>{en ? "No ancestry" : "Keine Herkunft"}</strong></div>}
        </div>
        <div className="dg-phone-section-title"><span>{en ? "Equipped & carried" : "Angelegt & im Gepäck"}</span><small>{model.equipment.length}</small></div>
        {model.equipment.length ? model.equipment.map((card) => {
          const equip = gearActions.find((action) => action.id === "gear:" + card.id);
          const sell = actions.get("sell:" + card.id);
          return <Gear key={card.id} card={card} en={en} canSell={Boolean(sell?.enabled)} equip={equip ? () => act(equip.id) : undefined} sell={sell ? () => act(sell.id) : undefined} />;
        }) : <p className="dg-phone-hint">{en ? "No gear equipped yet." : "Noch keine Ausrüstung angelegt."}</p>}
        {sellActions.some((action) => model.hand.some((card) => card.id === action.id.slice(5))) ? <>
          <div className="dg-phone-section-title"><span>{en ? "Sell from hand" : "Aus der Hand verkaufen"}</span><small>{en ? "Coin value" : "Münzwert"}</small></div>
          <div className="dg-phone-bag">{sellActions.map((action) => {
            const card = model.hand.find((candidate) => candidate.id === action.id.slice(5));
            return card ? <div className="dg-phone-bag-row" key={card.id}><Art card={card} /><strong>{card.title}</strong><button className="dg-phone-sell" type="button" disabled={!action.enabled} onClick={() => act(action.id)}><Icon name="sell" /><span>{card.goldValue ?? 0}</span></button></div> : null;
          })}</div>
        </> : null}
      </div> : <>
        {selected ? <div className="dg-phone-card-focus" aria-live="polite">
          <Art key={selected.id} card={selected} className="dg-phone-card-art-large" />
          <span className="dg-phone-card-kind">{names[selected.kind][en ? 1 : 0]}{selected.slot ? " · " + selected.slot : ""}</span>
          <h2 className="dg-phone-card-title">{selected.title}</h2>
          {selected.effect ? <p className="dg-phone-card-effect">{selected.effect}</p> : null}
          {stats(selected, en).length ? <div className="dg-phone-card-stats">{stats(selected, en).map(([label, value]) => <div className="dg-phone-card-stat" key={label}><span>{label}</span><b>{value}</b></div>)}</div> : null}
          <div className="dg-phone-detail-action">
            <button className="dg-phone-play" type="button" disabled={!selected.playable || !model.canAct} onClick={playSelected}>{en ? "Play card" : "Karte spielen"}</button>
          </div>
          {!selected.playable || !model.canAct ? <span className="dg-phone-hint">{en ? "Unavailable in this phase." : "In dieser Phase nicht spielbar."}</span> : null}
        </div> : <div className="dg-phone-card-focus"><span className="dg-phone-brand-mark">✦</span><p>{en ? "Your cards will appear here." : "Deine Karten erscheinen hier."}</p></div>}
        <div className="dg-phone-hand-wrap">
          <div className="dg-phone-hand-head"><span>{en ? "Your hand" : "Deine Hand"}</span><span>{model.hand.length}</span></div>
          <div className="dg-phone-hand" aria-label={en ? "Cards in your hand" : "Karten auf deiner Hand"}>
            {model.hand.map((card) => <button key={card.id} type="button" className={"dg-phone-thumb" + (selected?.id === card.id ? " is-selected" : "")} onClick={() => { haptics.tap(9); setSelectedId(card.id); }} aria-label={card.title + ". " + (card.effect ?? "")} aria-pressed={selected?.id === card.id}><Art card={card} /><strong>{card.title}</strong></button>)}
            {!model.hand.length ? <span className="dg-phone-hint">{en ? "No cards in hand." : "Keine Handkarten."}</span> : null}
          </div>
        </div>
      </>}
    </section>
    {turnActions.length ? <div className="dg-phone-actions" aria-label={en ? "Turn actions" : "Zugaktionen"}>{turnActions.map((action) => <button type="button" className={"dg-phone-action" + (action.kind === "primary" ? " primary" : "") + (action.kind === "danger" ? " danger" : "")} key={action.id} disabled={!action.enabled || (!model.canAct && action.id !== "help")} onClick={() => act(action.id)}>{action.id === "open-door" ? <Icon name="door" /> : action.id === "escape" || action.id === "fight" ? <Icon name="sword" /> : null}{action.label}</button>)}</div> : null}
    <nav className="dg-phone-nav" aria-label={en ? "Game view" : "Spielansicht"}>
      <button type="button" className="dg-phone-tab" aria-selected={page === "character"} onClick={() => { haptics.tap(8); setPage("character"); }}><Icon name="character" /><span>{en ? "Character" : "Charakter"}</span></button>
      <button type="button" className="dg-phone-tab" aria-selected={page === "cards"} onClick={() => { haptics.tap(8); setPage("cards"); }}><Icon name="cards" /><span>{en ? "Cards" : "Karten"} · {model.hand.length}</span></button>
    </nav>
  </main>;
}
