interface DPadProps {
  onDirection: (direction: "up" | "right" | "down" | "left") => void;
}

export function DPad({ onDirection }: DPadProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10
      }}
    >
      <div />
      <PadButton label="U" onClick={() => onDirection("up")} />
      <div />
      <PadButton label="L" onClick={() => onDirection("left")} />
      <div />
      <PadButton label="R" onClick={() => onDirection("right")} />
      <div />
      <PadButton label="D" onClick={() => onDirection("down")} />
      <div />
    </div>
  );
}

function PadButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 72,
        borderRadius: 18,
        border: "1px solid var(--panel-border)",
        background: "color-mix(in srgb, var(--surface) 70%, transparent)",
        color: "var(--text-main)",
        fontSize: "2rem"
      }}
    >
      {label}
    </button>
  );
}
