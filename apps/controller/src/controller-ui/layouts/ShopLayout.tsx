import { useEffect, useState } from "react";
import type { ShopLayoutModel } from "./models.js";
import { BigButton } from "../common/BigButton.js";

interface ShopLayoutProps {
  model: ShopLayoutModel;
}

function formatLabel(kind: ShopLayoutModel["offers"][number]["kind"], en: boolean): string {
  switch (kind) {
    case "weapon":
      return en ? "Weapon" : "Waffe";
    case "upgrade":
      return "Upgrade";
    default:
      return "Item";
  }
}

export function ShopLayout({ model }: ShopLayoutProps) {
  const en = model.language === "en";
  const [selectedWeaponInstanceId, setSelectedWeaponInstanceId] = useState<string | null>(null);
  const selectedWeapon =
    model.loadout?.weapons.find(
      (weapon) => weapon.weaponInstanceId === selectedWeaponInstanceId
    ) ??
    model.loadout?.weapons[0] ??
    null;

  useEffect(() => {
    if (!model.loadout?.weapons.length) {
      setSelectedWeaponInstanceId(null);
      return;
    }

    if (
      !selectedWeaponInstanceId ||
      !model.loadout.weapons.some(
        (weapon) => weapon.weaponInstanceId === selectedWeaponInstanceId
      )
    ) {
      setSelectedWeaponInstanceId(model.loadout.weapons[0].weaponInstanceId);
    }
  }, [model.loadout?.weapons, selectedWeaponInstanceId]);

  const showWeaponActions = Boolean(model.onSellWeapon || model.onCombineWeapon);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <header
        style={{
          display: "grid",
          gap: 8,
          padding: 18,
          borderRadius: 22,
          border: "1px solid var(--panel-border)",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.94) 0%, rgba(8, 47, 73, 0.82) 100%)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <strong style={{ fontSize: "1.3rem", color: model.accentColor ?? "var(--accent)" }}>{model.title}</strong>
          <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>{en ? "Wave" : "Welle"} {model.waveNumber}</span>
        </div>
        {model.subtitle ? <span style={{ color: "var(--text-muted)" }}>{model.subtitle}</span> : null}
        {model.helperText ? <span style={{ color: "var(--text-muted)" }}>{model.helperText}</span> : null}
      </header>

      {model.ready ? (
        <section
          style={{
            display: "grid",
            gap: 12,
            padding: 18,
            borderRadius: 22,
            border: "1px solid rgba(56, 189, 248, 0.35)",
            background: "linear-gradient(180deg, rgba(8, 47, 73, 0.5) 0%, rgba(15, 23, 42, 0.86) 100%)"
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontSize: "1.05rem" }}>
              {model.ready.currentPlayerReady ? (en ? "Ready for next wave" : "Bereit fuer naechste Welle") : en ? "Not ready yet" : "Noch nicht bereit"}
            </strong>
            <span style={{ color: "var(--text-muted)", lineHeight: 1.45 }}>
              {model.ready.description ?? (en
                ? `Waiting for all players. ${model.ready.readyCount}/${model.ready.playerCount} ready.`
                : `Warte auf alle Spieler. ${model.ready.readyCount}/${model.ready.playerCount} bereit.`)}
            </span>
          </div>

          <BigButton
            disabled={model.disabled}
            onClick={model.ready.onToggleReady}
            style={{
              opacity: model.disabled ? 0.55 : 1,
              minHeight: 64,
              background: model.ready.currentPlayerReady
                ? "linear-gradient(180deg, rgba(16, 185, 129, 0.94) 0%, rgba(5, 150, 105, 0.98) 100%)"
                : "linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)"
            }}
          >
            {model.ready.currentPlayerReady ? (en ? "Not ready" : "Nicht bereit") : model.ready.label}
          </BigButton>
        </section>
      ) : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12
        }}
      >
        <div
          style={{
            padding: 14,
            borderRadius: 18,
            background: "rgba(15, 23, 42, 0.52)",
            border: "1px solid var(--panel-border)"
          }}
        >
          <div style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>Material</div>
          <strong style={{ fontSize: "1.6rem" }}>{model.materials}</strong>
        </div>
        {typeof model.runSummary?.wavesCleared === "number" ? (
          <div
            style={{
              padding: 14,
              borderRadius: 18,
              background: "rgba(15, 23, 42, 0.52)",
              border: "1px solid var(--panel-border)"
            }}
          >
            <div style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>{en ? "Waves played" : "Gespielte Wellen"}</div>
            <strong style={{ fontSize: "1.6rem" }}>{model.runSummary.wavesCleared}</strong>
          </div>
        ) : null}
      </section>

      {model.loadout?.items?.length || model.loadout?.weapons?.length ? (
        <section style={{ display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: "1rem", color: "var(--text-muted)" }}>{en ? "Active Setup" : "Aktives Setup"}</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {model.loadout?.weapons?.map((weapon, index) => (
              <button
                type="button"
                key={weapon.weaponInstanceId}
                onClick={() => setSelectedWeaponInstanceId(weapon.weaponInstanceId)}
                style={{
                  display: "grid",
                  gridTemplateColumns: weapon.iconPath ? "44px 1fr auto" : "1fr auto",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 16,
                  background:
                    selectedWeapon?.weaponInstanceId === weapon.weaponInstanceId
                      ? "rgba(14, 165, 233, 0.2)"
                      : "rgba(8, 47, 73, 0.34)",
                  border:
                    selectedWeapon?.weaponInstanceId === weapon.weaponInstanceId
                      ? "1px solid rgba(56, 189, 248, 0.44)"
                      : "1px solid rgba(56, 189, 248, 0.18)",
                  color: "var(--text-main)",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                {weapon.iconPath ? (
                  <img
                    src={weapon.iconPath}
                    alt=""
                    width={40}
                    height={40}
                    style={{
                      borderRadius: 10,
                      objectFit: "contain",
                      background: "rgba(15, 23, 42, 0.68)",
                      border: "1px solid rgba(148, 163, 184, 0.18)",
                      padding: 4
                    }}
                  />
                ) : null}
                <span>
                  {`W${index + 1} ${weapon.displayName}`}
                  {weapon.sellable ? (
                    <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.68rem", marginTop: 2 }}>
                      {en ? "Sell" : "Verkauf"} {weapon.sellValue ?? 0} M
                    </span>
                  ) : null}
                  {weapon.canCombine ? (
                    <span
                      style={{
                        display: "block",
                        marginTop: 2,
                        color: "#86efac",
                        fontSize: "0.68rem",
                        fontWeight: 700
                      }}
                    >
                      {en ? "Merge ready" : "Kombi bereit"}
                    </span>
                  ) : null}
                </span>
                <strong>Lv. {weapon.level}</strong>
              </button>
            ))}
            {model.loadout?.items?.map((item) => (
              <div
                key={item.itemId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 16,
                  background: "rgba(15, 23, 42, 0.42)",
                  border: "1px solid rgba(148, 163, 184, 0.16)"
                }}
              >
                <span>{item.displayName}</span>
                <strong>Lv. {item.level}</strong>
              </div>
            ))}
          </div>
          {selectedWeapon && model.onCombineWeapon ? (
            <BigButton
              disabled={!selectedWeapon.canCombine}
              onClick={() => model.onCombineWeapon?.(selectedWeapon.weaponInstanceId)}
              style={{
                minHeight: 52,
                fontSize: "clamp(1.05rem, 2.7vw, 1.35rem)",
                opacity: selectedWeapon.canCombine ? 1 : 0.55,
                background: selectedWeapon.canCombine
                  ? "linear-gradient(180deg, rgba(16, 185, 129, 0.94) 0%, rgba(5, 150, 105, 0.98) 100%)"
                  : "rgba(30, 41, 59, 0.82)"
              }}
            >
              {selectedWeapon.canCombine
                ? en
                  ? `Merge ${selectedWeapon.displayName} to Lv. ${selectedWeapon.level + 1}`
                  : `${selectedWeapon.displayName} zu Lv. ${selectedWeapon.level + 1} kombinieren`
                : en
                  ? "Merge needs two matching weapons of the same level"
                  : "Kombinieren braucht zwei gleiche Waffen desselben Levels"}
            </BigButton>
          ) : null}
          {selectedWeapon ? (
            <section
              style={{
                display: "grid",
                gap: 10,
                padding: 14,
                borderRadius: 18,
                background: "rgba(8, 47, 73, 0.28)",
                border: "1px solid rgba(56, 189, 248, 0.2)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                <strong>{selectedWeapon.displayName}</strong>
                <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>Lv. {selectedWeapon.level}</span>
              </div>
              <span style={{ color: "var(--text-muted)", lineHeight: 1.45 }}>{selectedWeapon.description}</span>
              {selectedWeapon.stats?.length ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))",
                    gap: 8
                  }}
                >
                  {selectedWeapon.stats.map((stat) => (
                    <div
                      key={`${selectedWeapon.weaponInstanceId}:${stat.label}`}
                      style={{
                        display: "grid",
                        gap: 2,
                        padding: "8px 10px",
                        borderRadius: 12,
                        border: stat.highlighted
                          ? "1px solid rgba(56, 189, 248, 0.34)"
                          : "1px solid rgba(148, 163, 184, 0.14)",
                        background: stat.highlighted
                          ? "rgba(8, 47, 73, 0.5)"
                          : "rgba(15, 23, 42, 0.36)"
                      }}
                    >
                      <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.04em" }}>
                        {stat.label}
                      </span>
                      <strong style={{ fontSize: "0.92rem", lineHeight: 1.1 }}>{stat.value}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
              {showWeaponActions ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <BigButton
                  disabled={!selectedWeapon.sellable}
                  onClick={() => model.onSellWeapon?.(selectedWeapon.weaponInstanceId)}
                  style={{
                    minHeight: 52,
                    fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                    opacity: selectedWeapon.sellable ? 1 : 0.55,
                    background: selectedWeapon.sellable
                      ? "linear-gradient(180deg, rgba(249, 115, 22, 0.94) 0%, rgba(234, 88, 12, 0.98) 100%)"
                      : "rgba(30, 41, 59, 0.82)"
                  }}
                >
                  {selectedWeapon.sellable
                    ? en
                      ? `Sell for ${selectedWeapon.sellValue ?? 0} M`
                      : `Verkaufen fuer ${selectedWeapon.sellValue ?? 0} M`
                    : en ? "Cannot sell" : "Nicht verkaufbar"}
                </BigButton>
                {model.onCombineWeapon ? (
                  <BigButton
                    disabled={!selectedWeapon.canCombine}
                    onClick={() => model.onCombineWeapon?.(selectedWeapon.weaponInstanceId)}
                    style={{
                      minHeight: 52,
                      fontSize: "clamp(1.1rem, 2.7vw, 1.4rem)",
                      opacity: selectedWeapon.canCombine ? 1 : 0.55,
                      background: selectedWeapon.canCombine
                        ? "linear-gradient(180deg, rgba(16, 185, 129, 0.94) 0%, rgba(5, 150, 105, 0.98) 100%)"
                        : "rgba(30, 41, 59, 0.82)"
                    }}
                  >
                    {selectedWeapon.canCombine
                      ? en ? `Merge to Lv. ${selectedWeapon.level + 1}` : `Kombinieren zu Lv. ${selectedWeapon.level + 1}`
                      : en ? "No matching copy" : "Keine passende Kopie"}
                  </BigButton>
                ) : null}
                </div>
              ) : null}
            </section>
          ) : null}
        </section>
      ) : null}

      <section style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: "1rem", color: "var(--text-muted)" }}>Shop</h2>
          {model.reroll ? (
            <BigButton
              disabled={model.disabled || !model.reroll.affordable}
              onClick={model.reroll.onReroll}
              style={{
                minHeight: 52,
                fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                opacity: model.disabled || !model.reroll.affordable ? 0.55 : 1,
                background: "linear-gradient(180deg, rgba(249, 115, 22, 0.94) 0%, rgba(234, 88, 12, 0.98) 100%)"
              }}
            >
              {`${en ? "Reroll" : "Neu wuerfeln"} ${model.reroll.cost} M`}
            </BigButton>
          ) : null}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12
          }}
        >
          {model.offers.map((offer) => (
            <article
              key={offer.id}
              style={{
                display: "grid",
                gap: 10,
                padding: 14,
                borderRadius: 20,
                border: "1px solid var(--panel-border)",
                background: offer.purchased
                  ? "linear-gradient(180deg, rgba(16, 185, 129, 0.16), rgba(15, 23, 42, 0.72))"
                  : offer.affordable
                    ? "linear-gradient(180deg, rgba(14, 165, 233, 0.14), rgba(15, 23, 42, 0.72))"
                    : "rgba(15, 23, 42, 0.72)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  {offer.iconPath ? (
                    <img
                      src={offer.iconPath}
                      alt=""
                      width={42}
                      height={42}
                      style={{
                        borderRadius: 12,
                        objectFit: "cover",
                        background: "rgba(15, 23, 42, 0.7)",
                        border: "1px solid rgba(148, 163, 184, 0.18)"
                      }}
                    />
                  ) : null}
                  <div style={{ display: "grid", gap: 4 }}>
                    <strong>{offer.title}</strong>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      {formatLabel(offer.kind, en)}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    alignSelf: "start",
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: offer.affordable ? "rgba(34, 197, 94, 0.16)" : "rgba(148, 163, 184, 0.14)",
                    color: "var(--text-main)",
                    fontWeight: 800,
                    fontSize: "0.86rem"
                  }}
                >
                  {offer.cost} M
                </div>
              </div>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.45 }}>
                {offer.description}
              </p>
              {offer.summary ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>{offer.summary}</div>
              ) : null}
              {offer.stats?.length ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))",
                    gap: 8,
                    paddingTop: 2
                  }}
                >
                  {offer.stats.map((stat) => (
                    <div
                      key={`${offer.id}:${stat.label}`}
                      style={{
                        display: "grid",
                        gap: 2,
                        padding: "8px 10px",
                        borderRadius: 12,
                        border: stat.highlighted
                          ? "1px solid rgba(56, 189, 248, 0.34)"
                          : "1px solid rgba(148, 163, 184, 0.14)",
                        background: stat.highlighted
                          ? "rgba(8, 47, 73, 0.5)"
                          : "rgba(15, 23, 42, 0.36)"
                      }}
                    >
                      <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.04em" }}>
                        {stat.label}
                      </span>
                      <strong style={{ fontSize: "0.92rem", lineHeight: 1.1 }}>{stat.value}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                disabled={model.disabled || offer.purchased || !offer.affordable}
                onClick={() => model.onBuy(offer.id)}
                style={{
                  minHeight: 48,
                  borderRadius: 14,
                  border: "1px solid var(--panel-border)",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  background: offer.purchased
                    ? "rgba(16, 185, 129, 0.18)"
                    : offer.affordable
                      ? "linear-gradient(180deg, var(--accent) 0%, var(--accent-strong) 100%)"
                      : "rgba(30, 41, 59, 0.82)",
                  color: "var(--text-main)",
                  opacity: model.disabled ? 0.5 : 1,
                  cursor: model.disabled || offer.purchased || !offer.affordable ? "not-allowed" : "pointer",
                  touchAction: "manipulation"
                }}
              >
                  {offer.purchased
                    ? en ? "Bought" : "Gekauft"
                    : offer.affordable
                      ? en ? "Buy" : "Kaufen"
                      : en ? "Too expensive" : "Zu teuer"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
