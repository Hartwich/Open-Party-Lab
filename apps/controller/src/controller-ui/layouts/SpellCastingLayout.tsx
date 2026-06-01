import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type {
  SpellCastingGestureColor,
  SpellCastingGesturePoint,
  SpellCastingLayoutModel,
  SpellCastingSpellId,
  SpellCastingSpellModel
} from "./models.js";
import { ReadyPanel } from "../common/ReadyPanel.js";

interface SpellCastingLayoutProps {
  model: SpellCastingLayoutModel;
}

const colorHexByGesture = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e"
} as const satisfies Record<SpellCastingGestureColor, string>;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function formatSeconds(ms: number): string {
  if (ms <= 0) {
    return "0.0s";
  }

  return `${(ms / 1000).toFixed(1)}s`;
}

function pointsToPath(points: SpellCastingGesturePoint[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x * 1000} ${point.y * 1000}`)
    .join(" ");
}

function resolvePoint(
  event: PointerEvent<HTMLDivElement>,
  element: HTMLDivElement | null
): SpellCastingGesturePoint {
  if (!element) {
    return { x: 0.5, y: 0.5, t: Date.now() };
  }

  const rect = element.getBoundingClientRect();

  return {
    x: clamp01((event.clientX - rect.left) / rect.width),
    y: clamp01((event.clientY - rect.top) / rect.height),
    t: Date.now()
  };
}

function spellIdSignature(spells: SpellCastingSpellModel[]): string {
  return spells.map((spell) => spell.id).join(":");
}

function isSelectedSpellCastable(spell: SpellCastingSpellModel | null): boolean {
  return Boolean(spell && !spell.disabled);
}

function getCooldownProgress(spell: SpellCastingSpellModel): number {
  if (spell.cooldownRemainingMs <= 0 || spell.cooldownMs <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, spell.cooldownRemainingMs / spell.cooldownMs));
}

function spellIconStyle(iconPath: string, color: string, size: number): CSSProperties {
  return {
    width: size,
    height: size,
    ...spellMaskStyle(iconPath, color)
  };
}

function spellMaskStyle(iconPath: string, color: string): CSSProperties {
  return {
    backgroundColor: color,
    WebkitMask: `url(${iconPath}) center / contain no-repeat`,
    mask: `url(${iconPath}) center / contain no-repeat`
  };
}

function renderShapeGuide(spell: SpellCastingSpellModel | null, strokeColor: string) {
  if (!spell) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: "11%",
        opacity: 0.17,
        filter: `drop-shadow(0 0 22px ${strokeColor}66)`,
        pointerEvents: "none",
        ...spellMaskStyle(spell.iconPath, strokeColor)
      }}
    />
  );
}

export function SpellCastingLayout({ model }: SpellCastingLayoutProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const initialSpellId = model.selectedSpellId ?? model.spells[0]?.id ?? null;
  const [selectedSpellId, setSelectedSpellId] = useState<SpellCastingSpellId | null>(initialSpellId);
  const [points, setPoints] = useState<SpellCastingGesturePoint[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [localLock, setLocalLock] = useState<{ untilMs: number; totalMs: number } | null>(null);
  const spellIds = useMemo(() => spellIdSignature(model.spells), [model.spells]);
  const selectedSpell =
    model.spells.find((spell) => spell.id === selectedSpellId) ?? model.spells[0] ?? null;
  const strokeColor = selectedSpell ? colorHexByGesture[selectedSpell.color] : "#94a3b8";
  const localLockRemainingMs = localLock ? Math.max(0, localLock.untilMs - nowMs) : 0;
  const lockRemainingMs = Math.max(model.nextSpellReadyMs, localLockRemainingMs);
  const lockTotalMs =
    model.nextSpellReadyMs >= localLockRemainingMs
      ? Math.max(model.nextSpellTotalMs, model.nextSpellReadyMs, 1)
      : Math.max(localLock?.totalMs ?? 1, 1);
  const lockProgress = lockRemainingMs > 0 ? Math.max(0, Math.min(1, lockRemainingMs / lockTotalMs)) : 0;
  const canvasLocked = model.disabled || !isSelectedSpellCastable(selectedSpell) || lockRemainingMs > 0;

  useEffect(() => {
    const nextSpellId =
      model.selectedSpellId && model.spells.some((spell) => spell.id === model.selectedSpellId)
        ? model.selectedSpellId
        : model.spells[0]?.id ?? null;
    setSelectedSpellId(nextSpellId);
    setPoints([]);
  }, [model.resetKey, model.selectedSpellId, spellIds]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 80);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (model.nextSpellReadyMs <= 0) {
      return;
    }

    const now = Date.now();
    const nextLock = {
      untilMs: now + model.nextSpellReadyMs,
      totalMs: Math.max(model.nextSpellTotalMs, model.nextSpellReadyMs, 1)
    };

    setLocalLock((current) => {
      if (current && current.untilMs >= nextLock.untilMs - 40) {
        return current;
      }

      return nextLock;
    });
  }, [model.nextSpellReadyMs, model.nextSpellTotalMs]);

  function finishGesture() {
    if (!drawing) {
      return;
    }

    setDrawing(false);

    if (points.length < 2 || canvasLocked || !selectedSpell) {
      return;
    }

    model.onCastGesture(selectedSpell.id, points);

    const pendingCastMs = Math.max(450, selectedSpell.castMs);
    setLocalLock({
      untilMs: Date.now() + pendingCastMs,
      totalMs: pendingCastMs
    });

    setPoints([]);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: `${model.ready ? "auto " : ""}auto minmax(0, 1fr)`,
        gap: 9,
        height: "calc(100dvh - max(10px, env(safe-area-inset-top)) - max(10px, env(safe-area-inset-bottom)))",
        overflow: "hidden"
      }}
    >
      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 7 }}>
          {model.spells.slice(0, 12).map((spell) => {
            const selected = spell.id === selectedSpell?.id;
            const color = colorHexByGesture[spell.color];
            const cooldownProgress = getCooldownProgress(spell);
            const dimmed = spell.disabled && cooldownProgress <= 0;

            return (
              <button
                key={spell.id}
                type="button"
                aria-label={spell.label}
                title={spell.label}
                onClick={() => setSelectedSpellId(spell.id)}
                style={{
                  position: "relative",
                  minHeight: 45,
                  border: selected ? `2px solid ${color}` : "1px solid rgba(148, 163, 184, 0.22)",
                  borderRadius: 10,
                  background: selected ? "rgba(15, 23, 42, 0.94)" : "rgba(15, 23, 42, 0.55)",
                  color: "#f8fafc",
                  display: "grid",
                  placeItems: "center",
                  padding: 0,
                  overflow: "hidden",
                  opacity: dimmed ? 0.46 : 1,
                  boxShadow: selected ? `0 0 18px ${color}44` : "none"
                }}
              >
                {cooldownProgress > 0 ? (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `conic-gradient(from -90deg, rgba(59, 130, 246, 0.82) ${cooldownProgress * 360}deg, rgba(15, 23, 42, 0.08) 0deg)`,
                      opacity: 0.72
                    }}
                  />
                ) : null}
                <span
                  style={{
                    position: "relative",
                    zIndex: 1,
                    filter: "drop-shadow(0 1px 5px rgba(2, 6, 23, 0.85))",
                    ...spellIconStyle(spell.iconPath, color, 24)
                  }}
                />
                {cooldownProgress > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 3,
                      zIndex: 2,
                      color: "#eff6ff",
                      fontSize: 9,
                      fontWeight: 950,
                      lineHeight: 1,
                      textShadow: "0 1px 3px rgba(2, 6, 23, 0.92)"
                    }}
                  >
                    {formatSeconds(spell.cooldownRemainingMs)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <small style={{ color: "var(--text-muted)", fontSize: 11, minHeight: 14 }}>
          {lockRemainingMs > 0 ? formatSeconds(lockRemainingMs) : "0.0s"}
        </small>
      </div>

      <div
        ref={canvasRef}
        style={{
          position: "relative",
          minHeight: 0,
          border: `2px solid ${strokeColor}`,
          borderRadius: 14,
          background: "radial-gradient(circle at 50% 42%, rgba(30, 41, 59, 0.95), #020617 72%)",
          overflow: "hidden",
          touchAction: "none",
          opacity: model.disabled ? 0.72 : 1
        }}
        onPointerDown={(event) => {
          if (canvasLocked) {
            event.preventDefault();
            return;
          }

          const point = resolvePoint(event, canvasRef.current);
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrawing(true);
          setPoints([point]);
        }}
        onPointerMove={(event) => {
          if (!drawing || canvasLocked || event.buttons === 0) {
            return;
          }

          const point = resolvePoint(event, canvasRef.current);
          setPoints((current) => [...current, point]);
        }}
        onPointerUp={finishGesture}
        onPointerCancel={finishGesture}
      >
        {renderShapeGuide(selectedSpell, strokeColor)}
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
          {points.length > 1 ? (
            <path
              d={pointsToPath(points)}
              stroke={strokeColor}
              strokeWidth={13}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : null}
        </svg>
        {lockRemainingMs > 0 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              display: "grid",
              placeItems: "center",
              background:
                "linear-gradient(180deg, rgba(15, 23, 42, 0.58), rgba(2, 6, 23, 0.46)), radial-gradient(circle at 50% 42%, rgba(59, 130, 246, 0.24), transparent 60%)",
              backdropFilter: "blur(1px)",
              pointerEvents: "auto"
            }}
            onPointerDown={(event) => event.preventDefault()}
          >
            <div
              style={{
                width: "min(46vw, 188px)",
                aspectRatio: "1",
                borderRadius: 16,
                padding: 6,
                background: `conic-gradient(from -90deg, rgba(59, 130, 246, 0.84) ${lockProgress * 360}deg, rgba(15, 23, 42, 0.44) 0deg)`,
                boxShadow: "0 0 36px rgba(59, 130, 246, 0.42), inset 0 0 18px rgba(2, 6, 23, 0.55)",
                border: "1px solid rgba(147, 197, 253, 0.4)"
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  background:
                    "radial-gradient(circle at 50% 35%, rgba(30, 64, 175, 0.72), rgba(15, 23, 42, 0.9) 68%)",
                  color: "#eff6ff",
                  fontSize: "clamp(42px, 14vw, 68px)",
                  fontWeight: 950,
                  textShadow: "0 2px 8px rgba(2, 6, 23, 0.8)"
                }}
              >
                {formatSeconds(lockRemainingMs).replace("s", "")}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
