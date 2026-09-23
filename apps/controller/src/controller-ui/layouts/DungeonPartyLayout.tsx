import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useHaptics } from "../../hooks/useHaptics.js";
import type { DungeonPartyHandCardModel, DungeonPartyLayoutModel } from "./models.js";

interface Props { model: DungeonPartyLayoutModel }

const glyphs: Record<string, string> = {
  intrigue: "♛", false_bill: "¤", rally: "♫", ward: "⬟", jam: "⌁", reinforce: "♞",
  equipment: "⚒", loot: "✦"
};

function cardTone(card: DungeonPartyHandCardModel): string {
  if (card.effect === "intrigue" || card.effect === "false_bill") return "#a84d42";
  if (card.effect === "jam" || card.effect === "reinforce") return "#75526f";
  if (card.effect === "ward") return "#4e7885";
  if (card.effect === "rally") return "#b07d37";
  return "#748252";
}

function CardIllustration({ card }: { card: DungeonPartyHandCardModel }) {
  const art: Record<string, ReactNode> = {
    intrigue: <><path d="M17 13 32 5l15 8-4 4v20L32 48 21 37V17z" fill="#d4ab61" stroke="#39271b" strokeWidth="3"/><path d="m24 25 8 5 8-5-3 9H27z" fill="#43251f"/><path d="M27 21h2m8 0h2" stroke="#38251d" strokeWidth="3" strokeLinecap="round"/><path d="m32 5 3 7h-6z" fill="#f5e5b9"/></>,
    false_bill: <><path d="M14 12q-7 7 0 14t0 14l31-3q7-7 0-14t0-14z" fill="#efdfa9" stroke="#39271b" strokeWidth="3"/><path d="M21 20h16m-16 7h12m-12 7h9" stroke="#8b693e" strokeWidth="3"/><circle cx="40" cy="29" r="7" fill="#be8b38" stroke="#67411f" strokeWidth="2"/><path d="M40 24v10m-3-7h5" stroke="#f9e4a9" strokeWidth="2"/></>,
    rally: <><path d="M17 23q15-14 30 0v8q-15-14-30 0z" fill="#b77b32" stroke="#38271b" strokeWidth="3"/><path d="M15 20 10 16m6 15-8 3m35-14 7-5m-6 18 9 3" stroke="#f6d58b" strokeWidth="3" strokeLinecap="round"/><path d="M26 36v9m9-10v10" stroke="#e4d0a0" strokeWidth="3" strokeLinecap="round"/></>,
    ward: <><path d="M32 5 48 12v13q-1 13-16 21Q17 38 16 25V12z" fill="#6b96a0" stroke="#26343a" strokeWidth="3"/><path d="m23 27 6 6 12-14" fill="none" stroke="#e7ddbd" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M32 9v31" stroke="#b8d1c7" strokeWidth="1.5" opacity=".55"/></>,
    jam: <><path d="m12 36 33-19 7 11-33 19z" fill="#8b6035" stroke="#392719" strokeWidth="3"/><path d="m15 34 8 4m-2-12 8 4m4-12 7 4m-4 20 8 3" stroke="#dfbb7e" strokeWidth="2"/><path d="m29 16-4 10 7 4-5 11" fill="none" stroke="#f0ce83" strokeWidth="3" strokeLinecap="round"/></>,
    reinforce: <><path d="M13 20q1-13 19-15 18 2 19 15l-7 5-1 17H21l-1-17z" fill="#786277" stroke="#312532" strokeWidth="3"/><path d="M22 21q10-8 20 0l-2 9H24z" fill="#28232d"/><path d="m25 23 3 3 4-3 4 3 3-3" fill="none" stroke="#deb879" strokeWidth="3"/><path d="M32 8v8" stroke="#ecc67a" strokeWidth="3"/></>,
    equipment: <><path d="M14 44 39 19l5 5-25 25z" fill="#c8ae7d" stroke="#38281c" strokeWidth="3"/><path d="M36 19 39 8l9 9-10 3z" fill="#e9d4a1" stroke="#38281c" strokeWidth="3"/><path d="m18 43-5 6m8-12 8 8m-3-14 8 8" stroke="#563e28" strokeWidth="3"/></>
  };
  return <svg viewBox="0 0 64 54" aria-hidden="true" className="dp-card-illustration" style={{ width: 70, height: 56, filter: "drop-shadow(0 3px 3px #0007)" }}>{art[card.effect ?? card.artKey] ?? art.equipment}</svg>;
}

export function DungeonPartyLayout({ model }: Props) {
  const en = model.language === "en";
  const haptics = useHaptics();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const selected = model.hand.find((card) => card.id === selectedId) ?? null;
  const targetRequired = Boolean(selected && model.targetRequiredEffects.includes(selected.effect ?? ""));
  const validTargets = model.targets.filter((target) =>
    !(selected && model.targetForbiddenSelfEffects.includes(selected.effect ?? "") && target.id === model.ownPlayerId)
  );

  useEffect(() => {
    setSelectedId(null);
    setTargetId(null);
  }, [model.resetKey]);

  const playSelected = () => {
    if (!selected || !model.handPlayable || (targetRequired && !targetId)) return;
    haptics.tap(18);
    model.onPlayCard(selected.id, targetId ?? undefined);
    setSelectedId(null);
    setTargetId(null);
  };

  const selectCard = (card: DungeonPartyHandCardModel) => {
    if (!model.handPlayable) return;
    haptics.tap(12);
    setSelectedId((current) => current === card.id ? null : card.id);
    setTargetId(null);
  };

  return <main className="dp-phone" style={{ "--dp-accent": model.accentColor ?? "#b7773e" } as CSSProperties}>
    <style>{`
      @keyframes dp-card-arrive{from{opacity:0;transform:translateY(28px) rotate(var(--fan)) scale(.9)}to{opacity:1;transform:translateY(0) rotate(var(--fan)) scale(1)}}
      @keyframes dp-result-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      .dp-phone{--dp-ink:#f6efdf;--dp-muted:#c6b89e;--dp-line:#5b4b37;min-height:min(88dvh,820px);box-sizing:border-box;padding:14px;display:flex;flex-direction:column;gap:12px;border-radius:20px;background:radial-gradient(130% 90% at 50% 0%,#594329 0%,#29231b 47%,#1b1916 100%);color:var(--dp-ink);font-family:ui-sans-serif,system-ui,sans-serif;overflow:hidden}
      .dp-phone-head{display:flex;justify-content:space-between;align-items:start;gap:10px}.dp-phone-head small{display:block;color:#e0b875;font-weight:800;font-size:10px;letter-spacing:.16em;text-transform:uppercase}.dp-phone h2{font:500 26px/1.08 Georgia,serif;margin:5px 0 0}.dp-phone .dp-stage{border:1px solid #705936;color:#f2d69f;border-radius:999px;padding:6px 9px;font-size:10px;white-space:nowrap}
      .dp-phone-copy{font-size:13px;line-height:1.42;color:#d2c5b0;margin:0}.dp-phone-stats{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}.dp-phone-stat{flex:1;min-width:70px;border-top:1px solid #746146;padding:7px 2px 3px}.dp-phone-stat span{display:block;color:#baa98b;font-size:9px;text-transform:uppercase;letter-spacing:.12em}.dp-phone-stat b{display:block;margin-top:3px;font:19px Georgia,serif;color:#f6dfb4}
      .dp-phone-choices{display:grid;gap:7px}.dp-phone-choice{width:100%;text-align:left;border:1px solid #766345;border-radius:13px;background:#33291e;color:var(--dp-ink);padding:12px 13px;display:grid;gap:4px;font:inherit;cursor:pointer}.dp-phone-choice strong{font-size:14px}.dp-phone-choice span{font-size:11px;line-height:1.35;color:#cfbea1}.dp-phone-choice:disabled{opacity:.65}.dp-phone-choice:active{transform:scale(.99)}
      .dp-phone-section{display:grid;gap:6px;min-height:0}.dp-phone-section-head{display:flex;justify-content:space-between;align-items:baseline;color:#e5c286;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:800}.dp-phone-section-head em{font-style:normal;color:#aa9b7f;font-weight:600;letter-spacing:0;text-transform:none}
      .dp-phone-hand{display:flex;gap:0;overflow-x:auto;overflow-y:hidden;min-height:185px;padding:6px 5px 12px;align-items:flex-start;scrollbar-width:thin;scrollbar-color:#92724a transparent}.dp-phone-card{position:relative;flex:0 0 124px;width:124px;height:166px;border-radius:13px;padding:9px;box-sizing:border-box;border:1px solid #e0c28e;background:linear-gradient(155deg,#f3e6c8,#d7c29a 65%,#bfa67b);color:#2d261d;text-align:left;box-shadow:0 5px 14px #0007;transform:rotate(var(--fan));transform-origin:50% 95%;margin-right:-15px;animation:dp-card-arrive .38s cubic-bezier(.2,.75,.2,1) both;animation-delay:calc(var(--i)*35ms);cursor:pointer;transition:transform .18s,filter .18s,opacity .18s;overflow:hidden}.dp-phone-card:disabled{filter:grayscale(.45);opacity:.62}.dp-phone-card.is-selected{z-index:5;transform:translateY(-10px) rotate(0deg) scale(1.035);box-shadow:0 12px 25px #0009,0 0 0 2px #f2cb82}.dp-phone-card-top{display:flex;justify-content:space-between;align-items:center;font-size:8px;text-transform:uppercase;letter-spacing:.09em;font-weight:900;opacity:.75}.dp-phone-card-art{display:grid;place-items:center;height:57px;margin:5px 0 6px;border-radius:9px;background:radial-gradient(circle at 50% 42%,#fff8 0%,transparent 38%),linear-gradient(150deg,var(--tone),color-mix(in srgb,var(--tone) 58%,#15120f));color:#fff2d5;font:32px Georgia,serif;text-shadow:0 2px 8px #0008}.dp-phone-card-name{display:block;font:600 14px/1.05 Georgia,serif;max-height:31px;overflow:hidden}.dp-phone-card-desc{display:block;margin-top:4px;font-size:9px;line-height:1.18;max-height:31px;overflow:hidden;color:#554734}.dp-phone-targets{display:flex;gap:6px;overflow:auto}.dp-phone-target{white-space:nowrap;border:1px solid #806b49;background:#453827;color:#f5e7cb;border-radius:999px;padding:8px 10px;font-size:11px}.dp-phone-target.selected{background:#d49b4f;color:#241d13;border-color:#f0c879}.dp-phone-buttons{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dp-phone-button{border:0;border-radius:11px;padding:12px;background:#d2a35e;color:#241c13;font-weight:800;font-size:13px}.dp-phone-button.secondary{border:1px solid #756044;background:#29231a;color:#e3d0ae}.dp-phone-button:disabled{opacity:.45}.dp-phone-wait{border-left:3px solid var(--dp-accent);padding:8px 10px;background:#ffffff09;color:#d7c8ad;font-size:12px;line-height:1.4}.dp-phone-recap{display:grid;gap:6px;overflow:auto}.dp-phone-verdict{border-radius:13px;padding:11px 13px;display:flex;justify-content:space-between;align-items:center;background:${model.resolution?.success ? "#33442e" : "#512d29"};border:1px solid ${model.resolution?.success ? "#74915c" : "#a95e50"};animation:dp-result-in .35s ease-out both}.dp-phone-verdict b{font:22px Georgia,serif}.dp-phone-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 8px;padding:8px 10px;border-bottom:1px solid #ffffff20;font-size:11px}.dp-phone-row small{grid-column:1/-1;color:#cbbb9f;line-height:1.3}.dp-phone-deltas{white-space:nowrap;color:#ebd29f}.dp-phone-feed{font-size:11px;color:#c7b99e;line-height:1.4}.dp-phone-foot{margin-top:auto;display:grid;gap:6px}
      .dp-phone-played{display:flex;align-items:center;gap:11px;padding:9px 12px;border:1px solid #ac8250;border-radius:12px;background:linear-gradient(110deg,#574027,#30261b);animation:dp-card-throw .48s cubic-bezier(.18,.75,.28,1) both}.dp-phone-played-art{display:grid;place-items:center;width:42px;height:50px;border:1px solid #ead19d;border-radius:7px;background:linear-gradient(145deg,#d1a55d,#6d4c2a);font-size:22px}.dp-phone-played-copy{display:grid;gap:3px}.dp-phone-played-copy small{font-size:9px;letter-spacing:.1em;color:#d8b875;text-transform:uppercase}.dp-phone-played-copy b{font:15px Georgia,serif}.dp-phone-played-copy span{font-size:10px;color:#c6b596}.dp-phone-played-empty{border-style:dashed;color:#cbb894}.dp-phone-played-empty b{font:13px Georgia,serif}.dp-phone-played-empty small{font-size:9px;color:#bba987}@keyframes dp-card-throw{from{opacity:0;transform:translate(38px,-22px) rotate(12deg) scale(.8)}to{opacity:1;transform:translate(0) rotate(0) scale(1)}}
      @media(max-width:380px){.dp-phone{padding:10px}.dp-phone-card{flex-basis:112px;width:112px;height:158px}.dp-phone h2{font-size:23px}}
      @media(prefers-reduced-motion:reduce){.dp-phone-card,.dp-phone-verdict{animation:none!important;transition:none!important}}
    `}</style>
    <header className="dp-phone-head"><div><small>{en ? "DUNGEON PARTY · NO TIMER" : "DUNGEON PARTY · OHNE ZEITLIMIT"}</small><h2>{model.title}</h2></div>{model.statusLabel ? <span className="dp-stage">{model.statusLabel}</span> : null}</header>
    <p className="dp-phone-copy">{model.subtitle}<br />{model.helperText}</p>
    <section className="dp-phone-stats">{model.stats.map((stat) => <div className="dp-phone-stat" key={stat.label}><span>{stat.label}</span><b>{stat.value}</b></div>)}</section>

    {model.mode === "planning" || model.mode === "voting" ? <section className="dp-phone-choices" aria-label={model.title}>
      {model.choices.map((choice) => <button type="button" className="dp-phone-choice" key={choice.id} onClick={choice.onSelect} disabled={choice.disabled || model.disabled}><strong>{choice.label}</strong><span>{choice.description}</span></button>)}
    </section> : null}

    {model.mode === "waiting" && model.pendingCard ? <div className="dp-phone-played"><span className="dp-phone-played-art"><CardIllustration card={model.pendingCard} /></span><span className="dp-phone-played-copy"><small>{en ? "CARD LOCKED IN" : "KARTE ABGEGEBEN"}</small><b>{model.pendingCard.name}</b><span>{model.pendingCard.targetName ? (en ? "Target" : "Ziel") + ": " + model.pendingCard.targetName : (en ? "Ready for the reveal" : "Wartet auf die Auflösung")}</span></span></div> : null}

    {model.mode === "response" || model.mode === "waiting" || model.mode === "planning" ? <section className="dp-phone-section">
      <div className="dp-phone-section-head"><span>{model.handTitle}</span><em>{model.hand.length} {en ? "cards" : "Karten"}</em></div>
      <div className="dp-phone-hand" aria-label={model.handTitle}>
        {model.hand.length ? model.hand.map((card, index) => <button type="button" key={card.id} className={`dp-phone-card ${selectedId === card.id ? "is-selected" : ""}`} style={{ "--i": index, "--fan": `${(index - (model.hand.length - 1) / 2) * 2.5}deg`, "--tone": cardTone(card) } as CSSProperties} onClick={() => selectCard(card)} disabled={!model.handPlayable || card.kind !== "effect"} aria-label={`${card.name}. ${card.description}`} aria-pressed={selectedId === card.id}>
          <span className="dp-phone-card-top"><span>{card.kind === "effect" ? (en ? "ACTION" : "AKTION") : (en ? "GEAR" : "AUSRÜSTUNG")}</span><span>{glyphs[card.effect ?? "equipment"] ?? "✦"}</span></span>
          <span className="dp-phone-card-art"><CardIllustration card={card} /></span>
          <span className="dp-phone-card-name">{card.name}</span><span className="dp-phone-card-desc">{card.description}</span>
        </button>) : <span className="dp-phone-wait">{en ? "Your hand is empty." : "Deine Hand ist leer."}</span>}
      </div>
      {!model.handPlayable && model.handHint ? <div className="dp-phone-wait">{model.handHint}</div> : null}
      {model.mode === "response" ? <>
        {selected && targetRequired ? <div className="dp-phone-targets" aria-label={en ? "Choose a target" : "Ziel auswählen"}>{validTargets.map((target) => <button type="button" key={target.id} className={`dp-phone-target ${targetId === target.id ? "selected" : ""}`} onClick={() => setTargetId(target.id)}>{target.name}</button>)}</div> : null}
        <div className="dp-phone-buttons"><button type="button" className="dp-phone-button" onClick={playSelected} disabled={!selected || (targetRequired && !targetId)}>{model.playLabel}</button><button type="button" className="dp-phone-button secondary" onClick={model.onPass}>{model.passLabel}</button></div>
      </> : null}
    </section> : null}

    {model.mode === "waiting" ? <div className="dp-phone-wait" aria-live="polite">{model.handHint}</div> : null}
    {model.mode === "reveal" || model.mode === "complete" ? <section className="dp-phone-recap">
      {model.resolution ? <>
        <div className="dp-phone-verdict"><b>{model.resolution.success ? (en ? "SUCCESS" : "GESCHAFFT") : (en ? "FAILED" : "GESCHEITERT")}</b><strong>{model.resolution.partyPower} / {model.resolution.targetDifficulty}</strong></div>
        {model.resolution.cards.map((card) => <div className="dp-phone-feed" key={card}>{card}</div>)}
        {model.resolution.heroes.map((hero) => <div className="dp-phone-row" key={hero.name}><strong>{hero.name} · {hero.action} · d6 {hero.roll} · +{hero.contribution}</strong><span className="dp-phone-deltas">♥ {hero.healthDelta} · ✦ {hero.fameDelta} · ¤ {hero.goldDelta}</span>{hero.outcome ? <small>{hero.outcome}</small> : null}</div>)}
      </> : null}
      {model.mode === "reveal" ? <div className="dp-phone-foot"><div className="dp-phone-wait">{model.handHint}</div><button type="button" className="dp-phone-button" onClick={model.onContinue}>{model.continueLabel}</button></div> : null}
    </section> : null}
    {model.teamFeed.length > 0 && model.mode !== "reveal" && model.mode !== "complete" ? <section className="dp-phone-feed">{model.teamFeed.map((line) => <div key={line}>{line}</div>)}</section> : null}
  </main>;
}
