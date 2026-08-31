import type {
  CardTableBackStyle,
  CardTableCardState,
  CardTableColor
} from "@open-party-lab/protocol";

/**
 * Kartenbilder für die Phone-Hand.
 *
 * Reines SVG im Warm-Paper-Farbklima der Plattform: keine Assets, beliebig
 * skalierbar und identisch zu den Karten, die der Host aus derselben
 * Beschreibung rendert.
 */

const palette: Record<CardTableColor, { ink: string; accent: string }> = {
  red: { ink: "#b3382c", accent: "#f6d9d3" },
  black: { ink: "#24313a", accent: "#e0e3e0" },
  green: { ink: "#4b7150", accent: "#dfe9df" },
  blue: { ink: "#3a6183", accent: "#d8e3ee" },
  yellow: { ink: "#a9762c", accent: "#f7e7cd" },
  neutral: { ink: "#697178", accent: "#ece7dd" }
};

const pipLayouts: Record<number, Array<[number, number]>> = {
  1: [[0.5, 0.5]],
  2: [[0.5, 0.16], [0.5, 0.84]],
  3: [[0.5, 0.16], [0.5, 0.5], [0.5, 0.84]],
  4: [[0.32, 0.16], [0.68, 0.16], [0.32, 0.84], [0.68, 0.84]],
  5: [[0.32, 0.16], [0.68, 0.16], [0.5, 0.5], [0.32, 0.84], [0.68, 0.84]],
  6: [[0.32, 0.16], [0.68, 0.16], [0.32, 0.5], [0.68, 0.5], [0.32, 0.84], [0.68, 0.84]],
  7: [[0.32, 0.16], [0.68, 0.16], [0.5, 0.33], [0.32, 0.5], [0.68, 0.5], [0.32, 0.84], [0.68, 0.84]],
  8: [
    [0.32, 0.16], [0.68, 0.16], [0.5, 0.33], [0.32, 0.5],
    [0.68, 0.5], [0.5, 0.67], [0.32, 0.84], [0.68, 0.84]
  ],
  9: [
    [0.32, 0.16], [0.68, 0.16], [0.32, 0.38], [0.68, 0.38], [0.5, 0.5],
    [0.32, 0.62], [0.68, 0.62], [0.32, 0.84], [0.68, 0.84]
  ],
  10: [
    [0.32, 0.16], [0.68, 0.16], [0.5, 0.27], [0.32, 0.38], [0.68, 0.38],
    [0.32, 0.62], [0.68, 0.62], [0.5, 0.73], [0.32, 0.84], [0.68, 0.84]
  ]
};

const serif = 'Georgia, "Iowan Old Style", "Times New Roman", serif';
const artWidth = 100;
const artHeight = 140;

function pipsFor(rankLabel: string): Array<[number, number]> | null {
  const numeric = Number.parseInt(rankLabel, 10);
  return Number.isFinite(numeric) ? pipLayouts[numeric] ?? null : null;
}

interface PlayingCardProps {
  card: CardTableCardState;
  width: number;
  selected?: boolean;
  dimmed?: boolean;
}

/** Eine offene Spielkarte. Die Höhe folgt dem Standardverhältnis 1 : 1.4. */
export function PlayingCard({ card, width, selected = false, dimmed = false }: PlayingCardProps) {
  const colors = palette[card.color] ?? palette.neutral;
  const ink = dimmed ? "#9aa1a6" : colors.ink;
  const accent = dimmed ? "#eceae6" : colors.accent;
  const pips = card.centerLabel ? null : pipsFor(card.rankLabel);

  return (
    <svg
      viewBox={`0 0 ${artWidth} ${artHeight}`}
      width={width}
      height={width * 1.4}
      role="img"
      aria-label={`${card.rankLabel} ${card.suitLabel}`}
      style={{ display: "block", borderRadius: width * 0.08 }}
    >
      <rect
        x={1.5}
        y={1.5}
        width={artWidth - 3}
        height={artHeight - 3}
        rx={7}
        fill="#fffbf4"
        stroke={selected ? "#6e8b74" : "#ded5c7"}
        strokeWidth={selected ? 3 : 1.2}
      />
      <rect
        x={5.5}
        y={5.5}
        width={artWidth - 11}
        height={artHeight - 11}
        rx={5}
        fill="none"
        stroke={ink}
        strokeOpacity={0.14}
      />
      {card.centerLabel ? (
        <g>
          <circle cx={artWidth / 2} cy={artHeight / 2} r={artWidth * 0.29} fill={accent} />
          <text
            x={artWidth / 2}
            y={artHeight / 2 + 5}
            fontFamily={serif}
            fontSize={13}
            fontWeight={600}
            fill={ink}
            textAnchor="middle"
          >
            {card.centerLabel}
          </text>
        </g>
      ) : pips ? (
        pips.map(([px, py], index) => {
          const cx = artWidth * px;
          const cy = artHeight * (0.17 + py * 0.66);

          return (
            <text
              key={`${px}-${py}-${index}`}
              x={cx}
              y={cy + 6}
              fontFamily={serif}
              fontSize={18}
              fill={ink}
              textAnchor="middle"
              transform={py > 0.55 ? `rotate(180 ${cx} ${cy})` : undefined}
            >
              {card.suitSymbol}
            </text>
          );
        })
      ) : (
        <g>
          <rect
            x={artWidth * 0.19}
            y={artHeight * 0.19}
            width={artWidth * 0.62}
            height={artHeight * 0.62}
            rx={5}
            fill={accent}
            stroke={ink}
            strokeOpacity={0.35}
          />
          <text
            x={artWidth / 2}
            y={artHeight * 0.56}
            fontFamily={serif}
            fontSize={32}
            fontWeight={600}
            fill={ink}
            textAnchor="middle"
          >
            {card.rankLabel}
          </text>
          <text
            x={artWidth / 2}
            y={artHeight * 0.74}
            fontFamily={serif}
            fontSize={14}
            fill={ink}
            textAnchor="middle"
          >
            {card.suitSymbol}
          </text>
        </g>
      )}
      {[false, true].map((flipped) => (
        <g
          key={flipped ? "bottom" : "top"}
          transform={flipped ? `rotate(180 ${artWidth / 2} ${artHeight / 2})` : undefined}
        >
          <text x={13} y={20} fontFamily={serif} fontSize={17} fontWeight={600} fill={ink} textAnchor="middle">
            {card.rankLabel}
          </text>
          <text x={13} y={34} fontFamily={serif} fontSize={13} fill={ink} textAnchor="middle">
            {card.suitSymbol}
          </text>
        </g>
      ))}
    </svg>
  );
}

interface CardBackProps {
  style: CardTableBackStyle;
  width: number;
  count?: number;
}

/** Verdeckter Stapel mit optionaler Kartenzahl. */
export function CardBack({ style, width, count }: CardBackProps) {
  const patternId = `card-back-${style}`;
  const unit = 14;
  const pattern =
    style === "diamond" ? (
      <path d={`M ${unit / 2} 0 L ${unit} ${unit / 2} L ${unit / 2} ${unit} L 0 ${unit / 2} Z`} fill="#f3ece0" opacity={0.6} />
    ) : style === "wave" ? (
      <path
        d={`M 0 ${unit * 0.5} Q ${unit * 0.25} 0 ${unit * 0.5} ${unit * 0.5} T ${unit} ${unit * 0.5}`}
        fill="none"
        stroke="#f3ece0"
        strokeOpacity={0.65}
        strokeWidth={1.3}
      />
    ) : style === "grid" ? (
      <path d={`M ${unit} 0 L 0 0 0 ${unit}`} fill="none" stroke="#f3ece0" strokeOpacity={0.5} strokeWidth={1.1} />
    ) : (
      <circle cx={unit / 2} cy={unit / 2} r={2.6} fill="#f3ece0" opacity={0.75} />
    );

  return (
    <svg
      viewBox={`0 0 ${artWidth} ${artHeight}`}
      width={width}
      height={width * 1.4}
      role="img"
      aria-label="Kartenrücken"
      style={{ display: "block" }}
    >
      <defs>
        <pattern id={patternId} width={unit} height={unit} patternUnits="userSpaceOnUse">
          {pattern}
        </pattern>
      </defs>
      <rect x={1} y={1} width={artWidth - 2} height={artHeight - 2} rx={7} fill="#8d5f4a" stroke="#fffbf4" strokeWidth={2} />
      <rect x={7} y={8} width={artWidth - 14} height={artHeight - 16} rx={5} fill={`url(#${patternId})`} opacity={0.55} />
      <rect
        x={7}
        y={8}
        width={artWidth - 14}
        height={artHeight - 16}
        rx={5}
        fill="none"
        stroke="#f3ece0"
        strokeOpacity={0.7}
      />
      {typeof count === "number" ? (
        <>
          <circle cx={artWidth / 2} cy={artHeight / 2} r={19} fill="#2b2620" opacity={0.82} />
          <text
            x={artWidth / 2}
            y={artHeight / 2 + 7}
            fontFamily={serif}
            fontSize={20}
            fill="#fffbf4"
            textAnchor="middle"
          >
            {count}
          </text>
        </>
      ) : null}
    </svg>
  );
}
