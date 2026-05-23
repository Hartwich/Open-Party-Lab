import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type {
  ArenaSurvivorModernShopLayoutModel,
  LayoutStat,
  ShopOfferModel
} from "./models.js";

interface ArenaSurvivorModernShopLayoutProps {
  model: ArenaSurvivorModernShopLayoutModel;
}

type DetailTarget =
  | { type: "offer"; id: string }
  | { type: "weapon"; id: string }
  | { type: "item"; id: string }
  | { type: "stats" };

type DetailContent =
  | {
      type: "offer";
      title: string;
      subtitle: string;
      description?: string;
      iconPath?: string;
      summary?: string;
      tags?: string[];
      stats?: LayoutStat[];
      offer: ShopOfferModel;
    }
  | {
      type: "weapon";
      title: string;
      subtitle: string;
      description?: string;
      iconPath?: string;
      stats?: LayoutStat[];
      weapon: NonNullable<ArenaSurvivorModernShopLayoutModel["loadout"]>["weapons"][number];
    }
  | {
      type: "item";
      title: string;
      subtitle: string;
      description?: string;
      iconPath?: string;
      item: NonNullable<ArenaSurvivorModernShopLayoutModel["loadout"]>["items"][number];
    }
  | {
      type: "stats";
      title: string;
      subtitle: string;
      stats: LayoutStat[];
    };

function offerKindLabel(kind: ShopOfferModel["kind"], en: boolean): string {
  switch (kind) {
    case "weapon":
      return en ? "Weapon" : "Waffe";
    case "upgrade":
      return "Upgrade";
    default:
      return "Item";
  }
}

function compactPlayerName(title: string): string {
  return title.replace(/\s+Shop$/i, "").trim() || title;
}

function detailLinesToStats(lines?: Array<{ label: string; value: string }>): LayoutStat[] | undefined {
  if (!lines?.length) {
    return undefined;
  }

  return lines.map((line, index) => ({
    label: line.label,
    value: line.value,
    highlighted: index === 0 || /crit|schaden|damage|projektil|projectile|reichweite|range/i.test(line.label)
  }));
}

function iconInitial(label: string): string {
  return label.trim().slice(0, 1).toUpperCase() || "?";
}

function MaterialIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M12 3 21 12 12 21 3 12 12 3Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 3 15 12 12 21 9 12 12 3Z" stroke="currentColor" strokeWidth="1.6" opacity="0.72" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M3 14C5.4 10.8 8 10.8 10.4 14C12.8 17.2 15.4 17.2 18 14L21 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DiceIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" />
      <circle cx="15" cy="9" r="1.4" fill="currentColor" />
      <circle cx="9" cy="15" r="1.4" fill="currentColor" />
      <circle cx="15" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}

function ReadyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M5 12.5 10 17 19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 11V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function BuyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M6 7H20L18 15H8L6 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 7 5.3 4H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 9V13M10 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="19" r="1.4" fill="currentColor" />
      <circle cx="17" cy="19" r="1.4" fill="currentColor" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M5 19V11M12 19V5M19 19V8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function MergeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M12 20V5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M7 10 12 5 17 10" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 18H18" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function SellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M6 12H18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 7H16L19 12 16 17H8L5 12 8 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M7 7 17 17M17 7 7 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function IconFrame({ src, label, size = 56 }: { src?: string; label: string; size?: number }) {
  const sharedStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: 8,
    border: "1px solid rgba(148, 163, 184, 0.18)",
    background: "rgba(8, 13, 25, 0.78)",
    flex: "0 0 auto"
  };

  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{
          ...sharedStyle,
          objectFit: "contain",
          padding: 5
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...sharedStyle,
        display: "grid",
        placeItems: "center",
        color: "#facc15",
        fontWeight: 900,
        fontSize: size >= 56 ? "1.35rem" : "1rem"
      }}
    >
      {iconInitial(label)}
    </span>
  );
}

function MiniInfoBadge() {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        right: 7,
        top: 7,
        width: 24,
        height: 24,
        borderRadius: 8,
        display: "grid",
        placeItems: "center",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        background: "rgba(8, 13, 25, 0.88)",
        color: "#bae6fd"
      }}
    >
      <InfoIcon />
    </span>
  );
}

function MetricChip({
  icon,
  label,
  value,
  tone = "blue"
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone?: "blue" | "gold" | "green";
}) {
  const toneColor = tone === "gold" ? "#facc15" : tone === "green" ? "#86efac" : "#7dd3fc";

  return (
    <div
      style={{
        minHeight: 44,
        display: "grid",
        gridTemplateColumns: "22px minmax(0, 1fr)",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${toneColor}44`,
        background: "rgba(15, 23, 42, 0.68)",
        color: "var(--text-main)",
        minWidth: 0
      }}
    >
      <span style={{ color: toneColor, display: "grid", placeItems: "center" }}>{icon}</span>
      <span style={{ minWidth: 0, display: "grid", lineHeight: 1.05 }}>
        <strong style={{ fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}
        </strong>
        <span style={{ color: "var(--text-muted)", fontSize: "0.68rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
      </span>
    </div>
  );
}

function RoundIconButton({
  children,
  label,
  disabled,
  onClick,
  tone = "blue",
  badge
}: {
  children: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  tone?: "blue" | "green" | "orange" | "slate";
  badge?: string | number;
}) {
  const background =
    tone === "green"
      ? "linear-gradient(180deg, #22c55e 0%, #15803d 100%)"
      : tone === "orange"
        ? "linear-gradient(180deg, #f59e0b 0%, #c2410c 100%)"
        : tone === "slate"
          ? "rgba(30, 41, 59, 0.9)"
          : "linear-gradient(180deg, #38bdf8 0%, #0e7490 100%)";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        position: "relative",
        width: 52,
        height: 52,
        borderRadius: 8,
        border: "1px solid rgba(255, 255, 255, 0.16)",
        background,
        color: "white",
        display: "grid",
        placeItems: "center",
        opacity: disabled ? 0.46 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        touchAction: "manipulation",
        boxShadow: disabled ? "none" : "0 10px 22px rgba(2, 6, 23, 0.26)"
      }}
    >
      {children}
      {badge !== undefined ? (
        <span
          style={{
            position: "absolute",
            right: -5,
            top: -6,
            minWidth: 24,
            height: 24,
            padding: "0 6px",
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "rgba(8, 13, 25, 0.96)",
            color: "#facc15",
            fontSize: "0.72rem",
            fontWeight: 900
          }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function LoadoutTile({
  iconPath,
  title,
  subtitle,
  selected,
  onClick
}: {
  iconPath?: string;
  title: string;
  subtitle: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        width: 92,
        minHeight: 116,
        display: "grid",
        justifyItems: "center",
        alignContent: "start",
        gap: 7,
        padding: 8,
        borderRadius: 8,
        border: selected ? "1px solid rgba(250, 204, 21, 0.64)" : "1px solid rgba(148, 163, 184, 0.16)",
        background: selected ? "rgba(250, 204, 21, 0.12)" : "rgba(15, 23, 42, 0.58)",
        color: "var(--text-main)",
        cursor: "pointer",
        touchAction: "manipulation",
        textAlign: "center"
      }}
    >
      <MiniInfoBadge />
      <IconFrame src={iconPath} label={title} size={54} />
      <strong
        style={{
          width: "100%",
          minWidth: 0,
          fontSize: "0.75rem",
          lineHeight: 1.12,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical"
        }}
      >
        {title}
      </strong>
      <span style={{ color: "var(--text-muted)", fontSize: "0.68rem", fontWeight: 800 }}>{subtitle}</span>
    </button>
  );
}

function OfferTile({
  offer,
  model,
  en,
  onInfo
}: {
  offer: ShopOfferModel;
  model: ArenaSurvivorModernShopLayoutModel;
  en: boolean;
  onInfo: () => void;
}) {
  const canBuy = !model.disabled && offer.affordable && !offer.purchased;
  const borderColor = offer.purchased
    ? "rgba(34, 197, 94, 0.46)"
    : offer.affordable
      ? "rgba(56, 189, 248, 0.36)"
      : "rgba(148, 163, 184, 0.16)";

  return (
    <article
      style={{
        minHeight: 148,
        display: "grid",
        gridTemplateRows: "1fr 42px",
        borderRadius: 8,
        border: `1px solid ${borderColor}`,
        background: offer.purchased
          ? "linear-gradient(180deg, rgba(22, 101, 52, 0.28), rgba(15, 23, 42, 0.78))"
          : offer.affordable
            ? "linear-gradient(180deg, rgba(8, 145, 178, 0.22), rgba(15, 23, 42, 0.82))"
            : "rgba(15, 23, 42, 0.68)",
        overflow: "hidden",
        minWidth: 0
      }}
    >
      <button
        type="button"
        onClick={onInfo}
        aria-label={en ? `Show details for ${offer.title}` : `Details zu ${offer.title}`}
        style={{
          position: "relative",
          display: "grid",
          gridTemplateRows: "62px auto auto",
          gap: 7,
          justifyItems: "center",
          padding: "10px 8px 6px",
          border: 0,
          background: "transparent",
          color: "var(--text-main)",
          textAlign: "center",
          minWidth: 0,
          cursor: "pointer"
        }}
      >
        <MiniInfoBadge />
        <span style={{ position: "relative", display: "grid", placeItems: "center" }}>
          <IconFrame src={offer.iconPath} label={offer.title} size={60} />
          <span
            style={{
              position: "absolute",
              right: -10,
              bottom: -5,
              minWidth: 34,
              padding: "3px 6px",
              borderRadius: 8,
              background: offer.affordable ? "rgba(250, 204, 21, 0.96)" : "rgba(71, 85, 105, 0.96)",
              color: offer.affordable ? "#1f1300" : "var(--text-main)",
              fontSize: "0.72rem",
              fontWeight: 900
            }}
          >
            {offer.cost}
          </span>
        </span>
        <strong
          style={{
            maxWidth: "100%",
            minWidth: 0,
            fontSize: "0.78rem",
            lineHeight: 1.12,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical"
          }}
        >
          {offer.title}
        </strong>
        <span style={{ color: "var(--text-muted)", fontSize: "0.68rem", fontWeight: 800 }}>
          {offer.targetLevel ? `Lv. ${offer.targetLevel}` : offerKindLabel(offer.kind, en)}
        </span>
      </button>
      <button
        type="button"
        disabled={!canBuy}
        onClick={() => model.onBuy(offer.id)}
        aria-label={
          offer.purchased
            ? en ? `${offer.title} bought` : `${offer.title} gekauft`
            : en ? `Buy ${offer.title}` : `${offer.title} kaufen`
        }
        title={
          offer.purchased
            ? en ? "Bought" : "Gekauft"
            : offer.affordable
              ? en ? "Buy" : "Kaufen"
              : en ? "Too expensive" : "Zu teuer"
        }
        style={{
          border: 0,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: offer.purchased
            ? "rgba(34, 197, 94, 0.18)"
            : canBuy
              ? "rgba(34, 197, 94, 0.34)"
              : "rgba(30, 41, 59, 0.72)",
          color: canBuy || offer.purchased ? "#bbf7d0" : "rgba(226, 232, 240, 0.52)",
          display: "grid",
          placeItems: "center",
          cursor: canBuy ? "pointer" : "not-allowed",
          touchAction: "manipulation"
        }}
      >
        {offer.purchased ? <ReadyIcon /> : <BuyIcon />}
      </button>
    </article>
  );
}

function StatGrid({ stats }: { stats?: LayoutStat[] }) {
  if (!stats?.length) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 8
      }}
    >
      {stats.map((stat) => (
        <div
          key={`${stat.label}:${stat.value}`}
          style={{
            display: "grid",
            gap: 3,
            minWidth: 0,
            padding: "9px 10px",
            borderRadius: 8,
            border: stat.highlighted ? "1px solid rgba(250, 204, 21, 0.32)" : "1px solid rgba(148, 163, 184, 0.14)",
            background: stat.highlighted ? "rgba(250, 204, 21, 0.1)" : "rgba(15, 23, 42, 0.56)"
          }}
        >
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "0.7rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {stat.label}
          </span>
          <strong
            style={{
              fontSize: "0.96rem",
              lineHeight: 1.12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {stat.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

function resolveDetailContent(
  model: ArenaSurvivorModernShopLayoutModel,
  target: DetailTarget | null,
  en: boolean
): DetailContent | null {
  if (!target) {
    return null;
  }

  if (target.type === "stats") {
    return {
      type: "stats",
      title: "Stats",
      subtitle: en ? "Player values" : "Spielerwerte",
      stats: model.playerStats?.map((stat) => ({ ...stat })) ?? []
    };
  }

  if (target.type === "offer") {
    const offer = model.offers.find((entry) => entry.id === target.id);

    if (!offer) {
      return null;
    }

    return {
      type: "offer",
      title: offer.title,
      subtitle: offer.targetLevel ? `${offerKindLabel(offer.kind, en)} | Lv. ${offer.targetLevel} | ${offer.cost} M` : `${offerKindLabel(offer.kind, en)} | ${offer.cost} M`,
      description: offer.description,
      iconPath: offer.iconPath,
      summary: offer.summary,
      tags: offer.tags,
      stats: offer.stats ?? detailLinesToStats(offer.detailLines),
      offer
    };
  }

  if (target.type === "weapon") {
    const weapon = model.loadout?.weapons.find((entry) => entry.weaponInstanceId === target.id);

    if (!weapon) {
      return null;
    }

    return {
      type: "weapon",
      title: weapon.displayName,
      subtitle: `Lv. ${weapon.level}/${weapon.maxLevel}`,
      description: weapon.description,
      iconPath: weapon.iconPath,
      stats: weapon.stats,
      weapon
    };
  }

  const item = model.loadout?.items.find((entry) => entry.itemId === target.id);

  if (!item) {
    return null;
  }

  return {
    type: "item",
    title: item.displayName,
    subtitle: `Lv. ${item.level}`,
    description: item.description,
    iconPath: item.iconPath,
    item
  };
}

function DetailSheet({
  model,
  detail,
  en,
  onClose
}: {
  model: ArenaSurvivorModernShopLayoutModel;
  detail: DetailContent | null;
  en: boolean;
  onClose: () => void;
}) {
  if (!detail) {
    return null;
  }

  const canBuy = detail.type === "offer" && !model.disabled && detail.offer.affordable && !detail.offer.purchased;
  const canSell = detail.type === "weapon" && Boolean(detail.weapon.sellable && model.onSellWeapon);
  const canMerge = detail.type === "weapon" && Boolean(detail.weapon.canCombine && model.onCombineWeapon);

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "grid",
        alignItems: "end",
        padding: 12,
        background: "rgba(2, 6, 23, 0.68)"
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={detail.title}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(100%, 460px)",
          maxHeight: "82vh",
          justifySelf: "center",
          overflowY: "auto",
          display: "grid",
          gap: 14,
          padding: 14,
          borderRadius: 8,
          border: "1px solid rgba(148, 163, 184, 0.24)",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(8, 13, 25, 0.98))",
          boxShadow: "0 24px 52px rgba(0, 0, 0, 0.48)"
        }}
      >
        <header
          style={{
            display: "grid",
            gridTemplateColumns: detail.type === "stats" ? "1fr 44px" : "58px minmax(0, 1fr) 44px",
            gap: 10,
            alignItems: "center"
          }}
        >
          {detail.type === "stats" ? null : <IconFrame src={detail.iconPath} label={detail.title} size={56} />}
          <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
            <strong style={{ fontSize: "1.05rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {detail.title}
            </strong>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {detail.subtitle}
            </span>
          </div>
          <RoundIconButton label={en ? "Close" : "Schliessen"} onClick={onClose} tone="slate">
            <CloseIcon />
          </RoundIconButton>
        </header>

        {"description" in detail && detail.description ? (
          <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.45, fontSize: "0.92rem" }}>{detail.description}</p>
        ) : null}

        {detail.type === "offer" && detail.summary ? (
          <div
            style={{
              padding: "9px 10px",
              borderRadius: 8,
              border: "1px solid rgba(56, 189, 248, 0.22)",
              background: "rgba(8, 145, 178, 0.12)",
              color: "var(--text-main)",
              fontWeight: 800,
              fontSize: "0.86rem"
            }}
          >
            {detail.summary}
          </div>
        ) : null}

        {detail.type === "offer" && detail.tags?.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {detail.tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "4px 7px",
                  borderRadius: 8,
                  border: "1px solid rgba(148, 163, 184, 0.16)",
                  background: "rgba(30, 41, 59, 0.62)",
                  color: "var(--text-muted)",
                  fontSize: "0.72rem",
                  fontWeight: 800
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <StatGrid stats={detail.type === "item" ? undefined : detail.stats} />

        {detail.type === "offer" ? (
          <button
            type="button"
            disabled={!canBuy}
            onClick={() => {
              if (!canBuy) {
                return;
              }
              model.onBuy(detail.offer.id);
              onClose();
            }}
            style={{
              minHeight: 54,
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.14)",
              background: detail.offer.purchased
                ? "rgba(34, 197, 94, 0.18)"
                : canBuy
                  ? "linear-gradient(180deg, #22c55e 0%, #15803d 100%)"
                  : "rgba(30, 41, 59, 0.84)",
              color: "white",
              fontWeight: 900,
              cursor: canBuy ? "pointer" : "not-allowed",
              opacity: canBuy || detail.offer.purchased ? 1 : 0.55
            }}
          >
            {detail.offer.purchased
              ? en ? "Bought" : "Gekauft"
              : detail.offer.affordable
                ? en ? `Buy for ${detail.offer.cost} M` : `Kaufen fuer ${detail.offer.cost} M`
                : en ? `Need ${detail.offer.cost} M` : `${detail.offer.cost} M benoetigt`}
          </button>
        ) : null}

        {detail.type === "weapon" && (model.onSellWeapon || model.onCombineWeapon) ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {model.onCombineWeapon ? (
              <button
                type="button"
                disabled={!canMerge}
                onClick={() => {
                  if (!canMerge) {
                    return;
                  }
                  model.onCombineWeapon?.(detail.weapon.weaponInstanceId);
                  onClose();
                }}
                style={{
                  minHeight: 54,
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  background: canMerge ? "rgba(34, 197, 94, 0.36)" : "rgba(30, 41, 59, 0.78)",
                  color: canMerge ? "#bbf7d0" : "rgba(226, 232, 240, 0.56)",
                  display: "grid",
                  placeItems: "center",
                  cursor: canMerge ? "pointer" : "not-allowed"
                }}
              >
                <MergeIcon />
              </button>
            ) : null}
            {model.onSellWeapon ? (
              <button
                type="button"
                disabled={!canSell}
                onClick={() => {
                  if (!canSell) {
                    return;
                  }
                  model.onSellWeapon?.(detail.weapon.weaponInstanceId);
                  onClose();
                }}
                style={{
                  minHeight: 54,
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  background: canSell ? "rgba(249, 115, 22, 0.34)" : "rgba(30, 41, 59, 0.78)",
                  color: canSell ? "#fed7aa" : "rgba(226, 232, 240, 0.56)",
                  display: "grid",
                  gridTemplateColumns: "22px auto",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  cursor: canSell ? "pointer" : "not-allowed"
                }}
              >
                <SellIcon />
                <span style={{ fontWeight: 900 }}>{detail.weapon.sellValue ?? 0} M</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function ArenaSurvivorModernShopLayout({ model }: ArenaSurvivorModernShopLayoutProps) {
  const en = model.language === "en";
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const detail = useMemo(() => resolveDetailContent(model, detailTarget, en), [detailTarget, en, model]);
  const weapons = model.loadout?.weapons ?? [];
  const items = model.loadout?.items ?? [];
  const ready = model.ready;
  const readyLabel =
    ready?.currentPlayerReady
      ? en ? "Unset ready" : "Bereit entfernen"
      : ready?.label ?? (en ? "Ready" : "Bereit");

  return (
    <div style={{ display: "grid", gap: 12, paddingBottom: 16 }}>
      <header
        style={{
          display: "grid",
          gap: 10,
          padding: 12,
          borderRadius: 8,
          border: "1px solid rgba(148, 163, 184, 0.18)",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(8, 13, 25, 0.86))"
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 10, alignItems: "center" }}>
          <strong
            style={{
              minWidth: 0,
              fontSize: "1rem",
              color: model.accentColor ?? "var(--accent)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {compactPlayerName(model.title)}
          </strong>
          <RoundIconButton label={en ? "Show stats" : "Stats anzeigen"} onClick={() => setDetailTarget({ type: "stats" })} tone="slate">
            <StatsIcon />
          </RoundIconButton>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: ready ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8 }}>
          <MetricChip icon={<MaterialIcon />} label="M" value={model.materials} tone="gold" />
          <MetricChip icon={<WaveIcon />} label={en ? "Wave" : "Welle"} value={model.waveNumber} tone="blue" />
          {ready ? <MetricChip icon={<ReadyIcon />} label="OK" value={`${ready.readyCount}/${ready.playerCount}`} tone="green" /> : null}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: model.reroll && ready ? "1fr 1fr" : "1fr", gap: 8 }}>
          {model.reroll ? (
            <button
              type="button"
              disabled={model.disabled || !model.reroll.affordable}
              onClick={model.reroll.onReroll}
              aria-label={en ? `Reroll for ${model.reroll.cost} material` : `Neu wuerfeln fuer ${model.reroll.cost} Material`}
              title={en ? "Reroll" : "Neu wuerfeln"}
              style={{
                minHeight: 54,
                display: "grid",
                gridTemplateColumns: "22px auto",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.14)",
                background: model.reroll.affordable
                  ? "linear-gradient(180deg, #f59e0b 0%, #c2410c 100%)"
                  : "rgba(30, 41, 59, 0.84)",
                color: "white",
                fontWeight: 900,
                opacity: model.disabled || !model.reroll.affordable ? 0.55 : 1,
                cursor: model.disabled || !model.reroll.affordable ? "not-allowed" : "pointer",
                touchAction: "manipulation"
              }}
            >
              <DiceIcon />
              <span>{model.reroll.cost} M</span>
            </button>
          ) : null}
          {ready ? (
            <button
              type="button"
              disabled={model.disabled}
              onClick={ready.onToggleReady}
              aria-label={readyLabel}
              title={readyLabel}
              style={{
                minHeight: 54,
                display: "grid",
                gridTemplateColumns: "22px auto",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.14)",
                background: ready.currentPlayerReady
                  ? "linear-gradient(180deg, #22c55e 0%, #15803d 100%)"
                  : "linear-gradient(180deg, #38bdf8 0%, #0e7490 100%)",
                color: "white",
                fontWeight: 900,
                opacity: model.disabled ? 0.55 : 1,
                cursor: model.disabled ? "not-allowed" : "pointer",
                touchAction: "manipulation"
              }}
            >
              <ReadyIcon />
              <span>{ready.currentPlayerReady ? "OK" : ready.readyCount === ready.playerCount ? "GO" : `${ready.readyCount}/${ready.playerCount}`}</span>
            </button>
          ) : null}
        </div>
      </header>

      {weapons.length || items.length ? (
        <section style={{ display: "grid", gap: 8 }}>
          {weapons.length ? (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.76rem", fontWeight: 900 }}>{en ? "Weapons" : "Waffen"}</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                {weapons.map((weapon, index) => (
                  <LoadoutTile
                    key={weapon.weaponInstanceId}
                    iconPath={weapon.iconPath}
                    title={weapon.displayName}
                    subtitle={`W${index + 1} | Lv. ${weapon.level}`}
                    selected={weapon.canCombine}
                    onClick={() => setDetailTarget({ type: "weapon", id: weapon.weaponInstanceId })}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {items.length ? (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.76rem", fontWeight: 900 }}>Items</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                {items.map((item) => (
                  <LoadoutTile
                    key={item.itemId}
                    iconPath={item.iconPath}
                    title={item.displayName}
                    subtitle={`Lv. ${item.level}`}
                    onClick={() => setDetailTarget({ type: "item", id: item.itemId })}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section style={{ display: "grid", gap: 8 }} aria-label="Shop">
        <div style={{ color: "var(--text-muted)", fontSize: "0.76rem", fontWeight: 900 }}>Shop</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {model.offers.map((offer) => (
            <OfferTile
              key={offer.id}
              offer={offer}
              model={model}
              en={en}
              onInfo={() => setDetailTarget({ type: "offer", id: offer.id })}
            />
          ))}
        </div>
      </section>

      <DetailSheet model={model} detail={detail} en={en} onClose={() => setDetailTarget(null)} />
    </div>
  );
}
