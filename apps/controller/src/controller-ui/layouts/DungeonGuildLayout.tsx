import { useMemo, useState } from "react";
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

function slotLabel(card: DungeonGuildCardModel, en: boolean): string {
  const labels: Record<string, [string, string]> = { head: ["Kopf", "Head"], body: ["Körper", "Body"], feet: ["Füße", "Feet"], hands: [card.twoHand ? "Beide Hände" : "Eine Hand", card.twoHand ? "Both hands" : "One hand"], other: ["Extra", "Accessory"] };
  return (labels[card.slot ?? "other"] ?? labels.other)[en ? 1 : 0];
}

function replacements(card: DungeonGuildCardModel, equipment: DungeonGuildCardModel[]): DungeonGuildCardModel[] {
  const occupied = equipment.filter((item) => item.id !== card.id && item.equipped !== false && item.slot === card.slot);
  if (card.slot !== "hands") return occupied;
  let used = occupied.reduce((sum, item) => sum + (item.twoHand ? 2 : 1), 0);
  const result: DungeonGuildCardModel[] = [];
  for (const item of [...occupied].reverse()) {
    if (used + (card.twoHand ? 2 : 1) <= 2) break;
    result.push(item);
    used -= item.twoHand ? 2 : 1;
  }
  return result;
}

function BodyEquipment({ equipment, en, selectedId, onSelect }: { equipment: DungeonGuildCardModel[]; en: boolean; selectedId?: string; onSelect: (id: string) => void }) {
  const equipped = equipment.filter((card) => card.equipped !== false);
  const hands = equipped.filter((card) => card.slot === "hands");
  const twoHand = hands.find((card) => card.twoHand);
  const slots = [
    { id: "head", label: en ? "Head" : "Kopf", card: equipped.find((card) => card.slot === "head") },
    { id: "body", label: en ? "Body" : "Körper", card: equipped.find((card) => card.slot === "body") },
    { id: "left", label: en ? "Left hand" : "Linke Hand", card: twoHand ?? hands[0] },
    { id: "right", label: en ? "Right hand" : "Rechte Hand", card: twoHand ?? hands[1] },
    { id: "feet", label: en ? "Feet" : "Füße", card: equipped.find((card) => card.slot === "feet") },
    { id: "other", label: en ? "Accessory" : "Extra", card: equipped.find((card) => card.slot === "other") }
  ];
  return <div className="dg-phone-body" aria-label={en ? "Equipment slots on your body" : "Ausrüstungsplätze am Körper"}>
    <svg className="dg-phone-body-figure" viewBox="0 0 180 300" aria-hidden="true"><circle cx="90" cy="37" r="23" /><path d="M66 67h48l28 32 14 70-19 5-19-57-3 72 14 87-25 4-14-69-14 69-25-4 14-87-3-72-19 57-19-5 14-70z" /></svg>
    {slots.map(({ id, label, card }) => <button key={id} type="button" className={"dg-phone-body-slot slot-" + id + (card ? " is-filled" : "") + (card?.id === selectedId ? " is-selected" : "")} disabled={!card} aria-label={label + ": " + (card ? card.title + (card.twoHand ? (en ? ", uses both hands" : ", belegt beide Hände") : "") : (en ? "empty" : "frei"))} aria-pressed={Boolean(card && card.id === selectedId)} onClick={() => { if (card) onSelect(card.id); }}>
      <small>{label}</small>{card ? <><Art card={card} /><span>{card.twoHand ? (en ? "2 hands" : "2 Hände") : "+" + (card.bonus ?? 0)}</span></> : <span className="dg-phone-body-free">{en ? "Empty" : "Frei"}</span>}
    </button>)}
  </div>;
}

function stats(card: DungeonGuildCardModel, en: boolean): Array<[string, string]> {
  if (card.kind === "monster") return [
    [en ? "Strength" : "Stärke", String(card.level ?? 0)],
    [en ? "Rewards" : "Beute", (card.levelReward ?? 1) + (en ? " level" : " Stufe") + " · " + (card.goldValue ?? 1) + (en ? " cards" : " Karten")],
    [en ? "Escape" : "Flucht", (card.escapeTarget ?? 5) + "+"]
  ];
  if (card.kind === "item") return [
    [en ? "Bonus" : "Bonus", "+" + (card.bonus ?? 0)],
    [en ? "Slot" : "Platz", slotLabel(card, en)],
    [en ? "Value" : "Wert", (card.goldValue ?? 0) + (en ? " gold" : " Gold")]
  ];
  if (card.kind === "boost") return [[en ? "Combat" : "Kampf", "+" + (card.bonus ?? 0)], [en ? "Use" : "Einsatz", en ? "Once per fight" : "Einmal im Kampf"]];
  if (card.kind === "class" || card.kind === "race") return [[en ? "Strength" : "Stärke", "+" + (card.bonus ?? 0)]];
  return [];
}

function Gear({ card, en, equip, sell, canSell, canEquip = false, replaced = [] }: { card: DungeonGuildCardModel; en: boolean; equip?: () => void; sell?: () => void; canSell: boolean; canEquip?: boolean; replaced?: DungeonGuildCardModel[] }) {
  const isEquipped = card.equipped !== false;
  return <article className={"dg-phone-gear" + (isEquipped ? " is-equipped" : " is-carried")}>
    <Art card={card} className="dg-phone-gear-art" />
    <div className="dg-phone-gear-copy"><strong>{card.title}</strong><small>{card.kind === "item" ? slotLabel(card, en) + (isEquipped ? " · +" + (card.bonus ?? 0) : (en ? " · no active bonus" : " · kein aktiver Bonus")) : names[card.kind][en ? 1 : 0]}</small>{!isEquipped && replaced.length ? <small className="dg-phone-replacement">{en ? "Replaces: " : "Ersetzt: "}{replaced.map((item) => item.title).join(", ")}</small> : null}</div>
    {equip ? <button className="dg-phone-icon-action" type="button" disabled={!canEquip} aria-label={(isEquipped ? (en ? "Put in backpack: " : "In den Rucksack: ") : (en ? "Equip: " : "Anlegen: ")) + card.title} onClick={equip}><Icon name="equip" /><span>{isEquipped ? (en ? "Stow" : "Ablegen") : (en ? "Equip" : "Anlegen")}</span></button> : null}
    {sell ? <button className="dg-phone-sell" type="button" disabled={!canSell} onClick={sell} aria-label={(en ? "Sell " : "Verkaufen ") + card.title}><Icon name="sell" /><span>{card.goldValue ?? 0}</span></button> : null}
  </article>;
}

export function DungeonGuildLayout({ model }: Props) {
  const en = model.language === "en";
  const haptics = useHaptics();
  const [page, setPage] = useState<Page>("cards");
  const [selection, setSelection] = useState<{ round: string; id: string } | null>(null);
  const [equipmentId, setEquipmentId] = useState<string | null>(null);
  const inCombat = model.stage === "combat" || model.stage === "help";
  const selected = (selection?.round === model.resetKey ? model.hand.find((card) => card.id === selection.id) : undefined) ?? (inCombat ? model.hand.find((card) => card.playable) : undefined) ?? model.hand[0] ?? null;
  const equipped = model.equipment.filter((card) => card.equipped !== false);
  const backpack = model.equipment.filter((card) => card.equipped === false);
  const inspectedGear = equipped.find((card) => card.id === equipmentId) ?? equipped[0];
  const replaced = selected?.kind === "item" ? replacements(selected, model.equipment) : [];
  const playableCount = model.hand.filter((card) => card.playable).length;
  const actions = useMemo(() => new Map(model.actions.map((action) => [action.id, action])), [model.actions]);
  const sellActions = model.actions.filter((action) => action.id.startsWith("sell:"));
  const gearActions = model.actions.filter((action) => action.id.startsWith("gear:"));
  const turnActions = model.actions.filter((action) => !action.id.startsWith("sell:") && !action.id.startsWith("gear:"));
  const stageNames: Record<string, [string, string]> = {
    door: ["Vor der Tür", "At the door"], combat: ["Im Kampf", "In combat"], help: ["Hilfe gesucht", "Help requested"],
    loot: ["Beute", "Loot"], main: ["Zugaktionen", "Turn actions"], finished: ["Abenteuer beendet", "Adventure over"]
  };

  const act = (id: string) => {
    const action = actions.get(id);
    if (!action?.enabled || !model.canAct || model.disabled) return;
    haptics.tap(id === "escape" ? 22 : 14);
    model.onAction(id);
  };
  const playSelected = (options?: Parameters<DungeonGuildLayoutModel["onPlayCard"]>[1]) => {
    if (!selected?.playable || !model.canAct) return;
    haptics.tap(18);
    model.onPlayCard(selected.id, options);
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
    {model.lastError ? <div className="dg-phone-message" role="alert"><b aria-hidden="true">!</b><span>{model.lastError}</span></div> : null}
    <section className="dg-phone-content">
      {page === "character" ? <div className="dg-phone-character">
        {model.dead ? <div className="dg-phone-dead">{en ? "Your adventurer returns next turn." : "Deine Figur kehrt im nächsten Zug zurück."}</div> : null}
        <div className="dg-phone-section-title"><span>{en ? "Character" : "Charakter"}</span><small>{model.ownStrength} {en ? "strength" : "Stärke"}</small></div>
        <div className="dg-phone-identity">
          {model.classCard ? <Gear card={model.classCard} en={en} canSell={false} /> : <div className="dg-phone-gear dg-phone-empty-gear"><span>♜</span><strong>{en ? "No class" : "Keine Klasse"}</strong></div>}
          {model.raceCard ? <Gear card={model.raceCard} en={en} canSell={false} /> : <div className="dg-phone-gear dg-phone-empty-gear"><span>◇</span><strong>{en ? "No ancestry" : "Keine Herkunft"}</strong></div>}
        </div>
        <div className="dg-phone-section-title"><span>{en ? "On your body" : "Am Körper"}</span><small>{en ? "Tap a slot" : "Platz antippen"}</small></div>
        <BodyEquipment equipment={model.equipment} en={en} selectedId={inspectedGear?.id} onSelect={(id) => { haptics.tap(8); setEquipmentId(id); }} />
        {inspectedGear ? <Gear card={inspectedGear} en={en} canSell={Boolean(actions.get("sell:" + inspectedGear.id)?.enabled && model.canAct)} sell={actions.has("sell:" + inspectedGear.id) ? () => act("sell:" + inspectedGear.id) : undefined} equip={actions.has("gear:" + inspectedGear.id) ? () => act("gear:" + inspectedGear.id) : undefined} canEquip={Boolean(actions.get("gear:" + inspectedGear.id)?.enabled && model.canAct)} /> : null}
        <div className="dg-phone-section-title"><span>{en ? "Backpack" : "Rucksack"}</span><small>{backpack.length} · {en ? "not equipped" : "nicht angelegt"}</small></div>
        <p className="dg-phone-backpack-note">{en ? "Backpack gear gives no strength until equipped." : "Diese Gegenstände geben erst Stärke, wenn du sie anlegst."}</p>
        {backpack.length ? backpack.map((card) => {
          const equip = gearActions.find((action) => action.id === "gear:" + card.id);
          const sell = actions.get("sell:" + card.id);
          return <Gear key={card.id} card={card} en={en} canSell={Boolean(sell?.enabled && model.canAct)} canEquip={Boolean(equip?.enabled && model.canAct)} replaced={replacements(card, model.equipment)} equip={equip ? () => act(equip.id) : undefined} sell={sell ? () => act(sell.id) : undefined} />;
        }) : <p className="dg-phone-hint">{en ? "Your backpack is empty." : "Dein Rucksack ist leer."}</p>}
        {sellActions.some((action) => model.hand.some((card) => card.id === action.id.slice(5))) ? <>
          <div className="dg-phone-section-title"><span>{en ? "Sell from hand" : "Aus der Hand verkaufen"}</span><small>{en ? "Coin value" : "Münzwert"}</small></div>
          <div className="dg-phone-bag">{sellActions.map((action) => {
            const card = model.hand.find((candidate) => candidate.id === action.id.slice(5));
            return card ? <div className="dg-phone-bag-row" key={card.id}><Art card={card} /><strong>{card.title}</strong><button className="dg-phone-sell" type="button" disabled={!action.enabled || !model.canAct} aria-label={(en ? "Sell " : "Verkaufen: ") + card.title} onClick={() => act(action.id)}><Icon name="sell" /><span>{card.goldValue ?? 0}</span></button></div> : null;
          })}</div>
        </> : null}
      </div> : <>
        {selected ? <div className="dg-phone-card-focus" aria-live="polite">
          <Art key={selected.id} card={selected} className="dg-phone-card-art-large" />
          <span className="dg-phone-card-kind">{names[selected.kind][en ? 1 : 0]}{selected.slot ? " · " + slotLabel(selected, en) : ""}</span>
          <h2 className="dg-phone-card-title">{selected.title}</h2>
          {selected.effect ? <p className="dg-phone-card-effect">{selected.effect}</p> : null}
          {stats(selected, en).length ? <div className="dg-phone-card-stats">{stats(selected, en).map(([label, value]) => <div className="dg-phone-card-stat" key={label}><span>{label}</span><b>{value}</b></div>)}</div> : null}
          {selected.kind === "item" && replaced.length ? <p className="dg-phone-replacement">{en ? "Moves to backpack: " : "Wandert in den Rucksack: "}{replaced.map((card) => card.title).join(", ")}</p> : null}
          <div className={"dg-phone-detail-action" + (selected.kind === "item" || selected.kind === "boost" ? " has-two-actions" : "")}>
            {selected.kind === "boost" ? <>
              <button className="dg-phone-play" type="button" disabled={!selected.playable || !model.canAct} onClick={() => playSelected({ combatSide: "party" })}>{en ? "Party" : "Gruppe"} +{selected.bonus}</button>
              <button className="dg-phone-play dg-phone-monster-play" type="button" disabled={!selected.playable || !model.canAct} onClick={() => playSelected({ combatSide: "monster" })}>{en ? "Monster" : "Monster"} +{selected.bonus}</button>
            </> : selected.kind === "item" ? <>
              <button className="dg-phone-play" type="button" disabled={!selected.playable || !model.canAct} onClick={() => playSelected({ itemMode: "equip" })}>{en ? "Equip" : "Anlegen"}</button>
              <button className="dg-phone-play dg-phone-store-play" type="button" disabled={!selected.playable || !model.canAct} onClick={() => playSelected({ itemMode: "store" })}>{en ? "Backpack" : "In Rucksack"}</button>
            </> : <button className="dg-phone-play" type="button" disabled={!selected.playable || !model.canAct} onClick={() => playSelected()}>{en ? "Play card" : "Karte spielen"}</button>}
          </div>
          {!selected.playable || !model.canAct ? <span className="dg-phone-hint">{en ? "Unavailable in this phase." : "In dieser Phase nicht spielbar."}</span> : null}
        </div> : <div className="dg-phone-card-focus"><span className="dg-phone-brand-mark">✦</span><p>{en ? "Your cards will appear here." : "Deine Karten erscheinen hier."}</p></div>}
        <div className="dg-phone-hand-wrap">
          <div className="dg-phone-hand-head"><span>{inCombat ? (en ? "Intervene in combat" : "In den Kampf eingreifen") : (en ? "Your hand" : "Deine Hand")}</span><span>{inCombat ? playableCount + (en ? " playable" : " spielbar") : model.hand.length}</span></div>
          <div className="dg-phone-hand" aria-label={en ? "Cards in your hand" : "Karten auf deiner Hand"}>
            {model.hand.map((card) => <button key={card.id} type="button" className={"dg-phone-thumb" + (selected?.id === card.id ? " is-selected" : "") + (inCombat ? (card.playable ? " is-combat-playable" : " is-combat-inactive") : "")} onClick={() => { haptics.tap(9); setSelection({ round: model.resetKey, id: card.id }); }} aria-label={card.title + ". " + (inCombat && card.playable ? (en ? "Playable now. " : "Jetzt spielbar. ") : "") + (card.effect ?? "")} aria-pressed={selected?.id === card.id}><Art card={card} /><strong>{card.title}</strong>{inCombat && card.playable ? <span className="dg-phone-thumb-playable" aria-hidden="true">⚔</span> : null}</button>)}
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
