import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { ChaosKommandoLayoutModel } from "./models.js";

interface StickVector {
  x: number;
  y: number;
}

interface StickPadProps {
  label: string;
  accentColor: string;
  disabled: boolean;
  resetKey: string;
  onChange: (x: number, y: number) => void;
  size: string;
}

interface ControlVector {
  x: number;
  y: number;
}

const DEADZONE = 0.12;

function clampUnit(x: number, y: number): StickVector {
  const magnitude = Math.hypot(x, y);

  if (magnitude <= 0.0001) {
    return { x: 0, y: 0 };
  }

  if (magnitude <= 1) {
    return { x, y };
  }

  return {
    x: x / magnitude,
    y: y / magnitude
  };
}

function hasMeaningfulStickChange(previous: ControlVector, next: ControlVector): boolean {
  return Math.abs(previous.x - next.x) > 0.015 || Math.abs(previous.y - next.y) > 0.015;
}

function applyResponseMapping(x: number, y: number): ControlVector {
  const clamped = clampUnit(x, y);
  const magnitude = Math.hypot(clamped.x, clamped.y);

  if (magnitude <= DEADZONE) {
    return { x: 0, y: 0 };
  }

  const normalizedX = clamped.x / magnitude;
  const normalizedY = clamped.y / magnitude;
  const scaledMagnitude = (magnitude - DEADZONE) / (1 - DEADZONE);

  return {
    x: normalizedX * scaledMagnitude,
    y: normalizedY * scaledMagnitude
  };
}

function formatCountdown(untilMs: number | undefined, nowMs: number): string {
  if (!untilMs) {
    return "-";
  }

  return `${Math.max(0, Math.ceil((untilMs - nowMs) / 1000))}s`;
}

const StickPad = memo(function StickPad({ label, accentColor, disabled, resetKey, onChange, size }: StickPadProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  const lastVectorRef = useRef<ControlVector>({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  function emitMove(nextVector: ControlVector): void {
    if (!hasMeaningfulStickChange(lastVectorRef.current, nextVector)) {
      return;
    }

    lastVectorRef.current = nextVector;
    onChangeRef.current(nextVector.x, nextVector.y);
  }

  useEffect(() => {
    pointerIdRef.current = null;
    setOffset({ x: 0, y: 0 });
    if (lastVectorRef.current.x !== 0 || lastVectorRef.current.y !== 0) {
      lastVectorRef.current = { x: 0, y: 0 };
      onChangeRef.current(0, 0);
    }
  }, [disabled, resetKey]);

  useEffect(() => {
    return () => {
      if (lastVectorRef.current.x !== 0 || lastVectorRef.current.y !== 0) {
        onChangeRef.current(0, 0);
      }
    };
  }, []);

  function update(clientX: number, clientY: number): void {
    const pad = padRef.current;

    if (!pad) {
      return;
    }

    const rect = pad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const range = Math.min(rect.width, rect.height) * 0.32;
    const rawX = (clientX - centerX) / range;
    const rawY = (clientY - centerY) / range;
    const display = clampUnit(rawX, rawY);
    const nextVector = applyResponseMapping(rawX, rawY);

    setOffset({
      x: display.x * range,
      y: display.y * range
    });
    emitMove(nextVector);
  }

  function reset(): void {
    pointerIdRef.current = null;
    setOffset({ x: 0, y: 0 });
    if (lastVectorRef.current.x !== 0 || lastVectorRef.current.y !== 0) {
      lastVectorRef.current = { x: 0, y: 0 };
      onChangeRef.current(0, 0);
    }
  }

  return (
    <div
      ref={padRef}
      onPointerDown={(event) => {
        if (disabled) {
          return;
        }

        pointerIdRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (disabled || pointerIdRef.current !== event.pointerId) {
          return;
        }

        event.preventDefault();
        update(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        if (pointerIdRef.current === event.pointerId) {
          reset();
        }
      }}
      onPointerCancel={reset}
      onLostPointerCapture={reset}
      style={{
        position: "relative",
        width: size,
        aspectRatio: "1 / 1",
        borderRadius: "999px",
        border: `1px solid ${accentColor}`,
        background: disabled
          ? "radial-gradient(circle at 50% 50%, rgba(51, 65, 85, 0.7) 0%, rgba(2, 6, 23, 0.96) 78%)"
          : "radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.18) 0%, rgba(2, 6, 23, 0.96) 78%)",
        boxShadow: disabled ? "none" : "0 18px 42px rgba(14, 165, 233, 0.18)",
        touchAction: "none",
        userSelect: "none"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "16%",
          borderRadius: "999px",
          border: "1px solid rgba(148, 163, 184, 0.16)"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "34%",
          borderRadius: "999px",
          border: "1px solid rgba(148, 163, 184, 0.12)"
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "28%",
          aspectRatio: "1 / 1",
          borderRadius: "999px",
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
          background: `linear-gradient(180deg, ${accentColor} 0%, rgba(14, 165, 233, 0.92) 100%)`,
          display: "grid",
          placeItems: "center",
          color: "#f8fafc",
          fontWeight: 900,
          letterSpacing: "0.08em",
          fontSize: "0.72rem"
        }}
      >
        {label}
      </div>
    </div>
  );
}, (previousProps, nextProps) =>
  previousProps.label === nextProps.label &&
  previousProps.accentColor === nextProps.accentColor &&
  previousProps.disabled === nextProps.disabled &&
  previousProps.resetKey === nextProps.resetKey &&
  previousProps.size === nextProps.size
);

export function ChaosKommandoLayout({ model }: { model: ChaosKommandoLayoutModel }) {
  const en = model.language === "en";
  const [hudMode, setHudMode] = useState<"kommando" | "steuerung">("kommando");
  const [activePanel, setActivePanel] = useState<"mercs" | "weapons">("mercs");
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight >= window.innerWidth : true
  );
  const [isCharging, setIsCharging] = useState(false);
  const [chargePct, setChargePct] = useState(0);
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const chargingSinceRef = useRef<number | null>(null);
  const selectedWeapon = model.weapons.find((weapon) => weapon.selected) ?? model.weapons[0] ?? null;
  const compactStats = useMemo(
    () =>
      (model.stats ?? [])
        .filter((stat) => stat.label === "Zeit")
        .map((stat) =>
          stat.label === "Zeit"
            ? {
                ...stat,
                value: formatCountdown(model.countdownEndsAtMs, clockNowMs)
              }
            : stat
        ),
    [clockNowMs, model.countdownEndsAtMs, model.stats]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => {
      setIsPortrait(window.innerHeight >= window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setClockNowMs(Date.now());

    if (!model.countdownEndsAtMs) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setClockNowMs(Date.now());
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [model.countdownEndsAtMs]);

  useEffect(() => {
    chargingSinceRef.current = null;
    setIsCharging(false);
    setChargePct(0);
    setHudMode("kommando");
  }, [model.resetKey, model.disabled]);

  useEffect(() => {
    if (!isCharging || chargingSinceRef.current === null) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      if (chargingSinceRef.current === null) {
        setChargePct(0);
        return;
      }

      setChargePct(Math.min(1, (Date.now() - chargingSinceRef.current) / 1400));
    }, 40);

    return () => {
      window.clearInterval(timer);
    };
  }, [isCharging, model.resetKey]);

  useEffect(() => {
    if (model.fireMode !== "charged") {
      chargingSinceRef.current = null;
      setIsCharging(false);
      setChargePct(0);
    }
  }, [model.fireMode]);

  function beginCharge(): void {
    if (model.disabled) {
      return;
    }

    chargingSinceRef.current = Date.now();
    setIsCharging(true);
    setChargePct(0);
    model.onFireStart();
  }

  function endCharge(): void {
    if (chargingSinceRef.current === null) {
      return;
    }

    chargingSinceRef.current = null;
    setIsCharging(false);
    setChargePct(0);
    model.onFireEnd();
  }

  function handleFirePointerDown(event: React.PointerEvent<HTMLButtonElement>): void {
    if (model.disabled) {
      return;
    }

    event.preventDefault();

    if (model.fireMode === "instant") {
      model.onFireStart();
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    beginCharge();
  }

  function handleFirePointerUp(): void {
    if (model.fireMode !== "charged") {
      return;
    }

    endCharge();
  }

  const layoutGap = "clamp(10px, 2.8vw, 14px)";
  const chipGap = "clamp(6px, 1.8vw, 8px)";
  const panelGap = "clamp(10px, 2.8vw, 14px)";
  const panelPadding = isPortrait ? "clamp(14px, 4vw, 18px)" : "clamp(14px, 2.2vw, 20px)";
  const panelRadius = "clamp(20px, 5vw, 24px)";
  const tileRadius = "clamp(18px, 4.5vw, 22px)";
  const iconSize = isPortrait ? "clamp(60px, 18vw, 76px)" : "clamp(58px, 10vw, 74px)";
  const stickSize = isPortrait ? "min(34vw, 30vh, 208px)" : "min(24vw, 42vh, 220px)";
  const fireSize = isPortrait ? "min(25vw, 19vh, 132px)" : "min(15vw, 24vh, 132px)";
  const jumpSize = isPortrait ? "min(18vw, 12vh, 84px)" : "min(10vw, 16vh, 82px)";
  const weaponColumns = isPortrait ? "repeat(4, minmax(0, 1fr))" : "repeat(5, minmax(0, 1fr))";
  const mercenaryColumns = isPortrait ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))";

  return (
    <div style={{ display: "grid", gap: layoutGap, width: "100%" }}>
      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: chipGap,
          padding: "clamp(5px, 1.4vw, 6px)",
          borderRadius: 999,
          border: "1px solid rgba(148, 163, 184, 0.16)",
          background: "rgba(15, 23, 42, 0.76)"
        }}
      >
        <button
          type="button"
          onClick={() => setHudMode("kommando")}
          style={modeToggleStyle(hudMode === "kommando", model.accentColor)}
        >
          {en ? "COMMAND" : "KOMMANDO"}
        </button>
        <button
          type="button"
          onClick={() => setHudMode("steuerung")}
          style={modeToggleStyle(hudMode === "steuerung", "#fb7185")}
        >
          {en ? "CONTROLS" : "STEUERUNG"}
        </button>
      </div>

      {compactStats.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: chipGap }}>
          {compactStats.map((stat) => (
            <span
              key={`${stat.label}:${stat.value}`}
              style={statChipStyle(stat.highlighted ? model.accentColor ?? "#22d3ee" : "#64748b")}
            >
              {stat.label}: {stat.value}
            </span>
          ))}
        </div>
      ) : null}

      {hudMode === "kommando" ? (
        <div
          style={{
            display: "grid",
            gap: panelGap,
            padding: panelPadding,
            borderRadius: panelRadius,
            border: "1px solid rgba(148, 163, 184, 0.16)",
            background: "linear-gradient(180deg, rgba(15, 23, 42, 0.88) 0%, rgba(8, 13, 27, 0.98) 100%)"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "clamp(10px, 2.4vw, 12px)",
              flexWrap: "wrap"
            }}
          >
            <strong style={{ fontSize: "clamp(0.96rem, 2.6vw, 1rem)" }}>Loadout</strong>
            <div style={{ display: "flex", gap: chipGap, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setActivePanel("mercs")}
                style={toggleStyle(activePanel === "mercs", model.accentColor)}
              >
                TEAM
              </button>
              <button
                type="button"
                onClick={() => setActivePanel("weapons")}
                style={toggleStyle(activePanel === "weapons", "#fb7185")}
              >
                {en ? "WEAPONS" : "WAFFEN"}
              </button>
            </div>
          </div>

          {activePanel === "weapons" && selectedWeapon ? (
            <div style={weaponInfoStyle}>
              <strong style={{ fontSize: "0.98rem" }}>{selectedWeapon.label}</strong>
              <span style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>{selectedWeapon.subtitle}</span>
            </div>
          ) : null}

          {activePanel === "mercs" ? (
            <div
              style={{
                display: "grid",
                gap: panelGap,
                gridTemplateColumns: mercenaryColumns
              }}
            >
              {model.mercenaries.map((mercenary) => (
                <button
                  key={mercenary.id}
                  type="button"
                  disabled={mercenary.disabled}
                  onClick={mercenary.onSelect}
                  style={{
                    display: "grid",
                    justifyItems: "center",
                    gap: "clamp(8px, 2vw, 10px)",
                    padding: "clamp(12px, 3.4vw, 16px)",
                    borderRadius: tileRadius,
                    border: mercenary.selected
                      ? `1px solid ${mercenary.teamColor ?? model.accentColor ?? "#22d3ee"}`
                      : "1px solid rgba(148, 163, 184, 0.16)",
                    background: mercenary.selected
                      ? "linear-gradient(180deg, rgba(20, 184, 166, 0.18) 0%, rgba(15, 23, 42, 0.72) 100%)"
                      : "rgba(15, 23, 42, 0.68)",
                    color: "#f8fafc",
                    opacity: mercenary.disabled ? 0.42 : 1
                  }}
                >
                  {mercenary.iconPath ? (
                    <img
                      src={mercenary.iconPath}
                      alt=""
                      style={{
                        width: iconSize,
                        height: iconSize,
                        objectFit: "contain",
                        filter: mercenary.disabled ? "grayscale(1)" : "none"
                      }}
                    />
                  ) : null}
                  <strong style={{ fontSize: "clamp(0.9rem, 2.5vw, 0.98rem)", textAlign: "center" }}>
                    {mercenary.label}
                  </strong>
                  <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "clamp(0.78rem, 2.2vw, 0.88rem)" }}>
                    {mercenary.hpLabel}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: panelGap,
                gridTemplateColumns: weaponColumns,
                alignItems: "stretch"
              }}
            >
              {model.weapons.map((weapon) => (
                <button
                  key={weapon.id}
                  type="button"
                  disabled={weapon.disabled}
                  onClick={weapon.onSelect}
                  style={{
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                    width: "100%",
                    aspectRatio: "1 / 1",
                    padding: "clamp(10px, 3vw, 14px)",
                    borderRadius: tileRadius,
                    border: weapon.selected
                      ? `1px solid ${weapon.accentColor ?? "#fb7185"}`
                      : "1px solid rgba(148, 163, 184, 0.16)",
                    background: weapon.selected
                      ? "linear-gradient(180deg, rgba(251, 113, 133, 0.18) 0%, rgba(15, 23, 42, 0.72) 100%)"
                      : "rgba(15, 23, 42, 0.68)",
                    color: "#f8fafc",
                    opacity: weapon.disabled ? 0.42 : 1
                  }}
                >
                  <span style={ammoBadgeStyle(weapon.selected ? weapon.accentColor ?? "#fb7185" : "#64748b")}>
                    {weapon.ammoLabel}
                  </span>
                  {weapon.iconPath ? (
                    <img
                      src={weapon.iconPath}
                      alt=""
                      style={{
                        width: "68%",
                        height: "68%",
                        objectFit: "contain",
                        filter: weapon.disabled ? "grayscale(1)" : "none"
                      }}
                    />
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
            alignItems: "end",
            gap: isPortrait ? "clamp(10px, 2.8vw, 14px)" : "clamp(14px, 2vw, 18px)"
          }}
        >
          <div style={{ display: "grid", justifyItems: "center" }}>
            <StickPad
              label="MOVE"
              accentColor={model.accentColor ?? "#22d3ee"}
              disabled={model.disabled}
              resetKey={model.resetKey}
              onChange={model.onMoveChange}
              size={stickSize}
            />
          </div>

          <div style={{ display: "grid", justifyItems: "center", gap: "clamp(14px, 3vw, 16px)" }}>
            <button
              type="button"
              disabled={model.disabled}
              onPointerDown={handleFirePointerDown}
              onPointerUp={handleFirePointerUp}
              onPointerCancel={handleFirePointerUp}
              onLostPointerCapture={handleFirePointerUp}
              style={{
                position: "relative",
                width: fireSize,
                aspectRatio: "1 / 1",
                borderRadius: "999px",
                overflow: "hidden",
                border: "1px solid rgba(248, 113, 113, 0.34)",
                background: model.disabled
                  ? "linear-gradient(180deg, rgba(71, 85, 105, 0.86) 0%, rgba(30, 41, 59, 0.98) 100%)"
                  : "linear-gradient(180deg, rgba(251, 113, 133, 0.95) 0%, rgba(190, 24, 93, 0.96) 100%)",
                color: "#fff1f2",
                boxShadow: model.disabled ? "none" : "0 18px 40px rgba(190, 24, 93, 0.22)",
                touchAction: "none"
              }}
            >
              {model.fireMode === "charged" ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: `scaleY(${chargePct})`,
                    transformOrigin: "bottom",
                    background: "linear-gradient(180deg, rgba(255, 228, 230, 0.16) 0%, rgba(254, 205, 211, 0.46) 100%)",
                    pointerEvents: "none"
                  }}
                />
              ) : null}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "grid",
                  placeItems: "center",
                  width: "100%",
                  height: "100%",
                  fontWeight: 900,
                  fontSize: "clamp(0.76rem, 2.3vw, 0.84rem)",
                  letterSpacing: "0.08em",
                  textAlign: "center",
                  padding: "clamp(8px, 2vw, 10px)"
                }}
              >
                {model.fireLabel}
              </div>
            </button>

            <button
              type="button"
              disabled={model.disabled}
              onPointerDown={(event) => {
                event.preventDefault();
                model.onJump();
              }}
              style={{
                width: jumpSize,
                aspectRatio: "1 / 1",
                marginTop: "clamp(8px, 2vw, 10px)",
                borderRadius: "999px",
                border: "1px solid rgba(125, 211, 252, 0.28)",
                background: model.disabled
                  ? "linear-gradient(180deg, rgba(71, 85, 105, 0.86) 0%, rgba(30, 41, 59, 0.98) 100%)"
                  : "linear-gradient(180deg, rgba(34, 211, 238, 0.94) 0%, rgba(8, 145, 178, 0.94) 100%)",
                color: "#f0f9ff",
                fontWeight: 800,
                fontSize: "clamp(0.7rem, 2vw, 0.76rem)",
                letterSpacing: "0.06em"
              }}
            >
              {en ? "JUMP" : "SPRUNG"}
            </button>
          </div>

          <div style={{ display: "grid", justifyItems: "center" }}>
            <StickPad
              label="AIM"
              accentColor="#fb7185"
              disabled={model.disabled}
              resetKey={model.resetKey}
              onChange={model.onAimChange}
              size={stickSize}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function modeToggleStyle(active: boolean, color: string | undefined) {
  const resolvedColor = color ?? "#22d3ee";

  return {
    borderRadius: 999,
    padding: "clamp(10px, 2.8vw, 12px) clamp(14px, 4vw, 16px)",
    border: `1px solid ${active ? resolvedColor : "transparent"}`,
    background: active ? `${resolvedColor}26` : "transparent",
    color: "#f8fafc",
    fontWeight: 800,
    fontSize: "clamp(0.76rem, 2.2vw, 0.84rem)",
    letterSpacing: "0.06em"
  } as const;
}

function toggleStyle(active: boolean, color: string | undefined) {
  const resolvedColor = color ?? "#22d3ee";

  return {
    borderRadius: 999,
    padding: "clamp(9px, 2.4vw, 10px) clamp(12px, 3.6vw, 16px)",
    border: `1px solid ${active ? resolvedColor : "rgba(148, 163, 184, 0.18)"}`,
    background: active ? `${resolvedColor}22` : "rgba(15, 23, 42, 0.6)",
    color: "#f8fafc",
    fontWeight: 800,
    fontSize: "clamp(0.74rem, 2.1vw, 0.82rem)",
    letterSpacing: "0.06em"
  } as const;
}

function statChipStyle(color: string) {
  return {
    borderRadius: 999,
    padding: "clamp(6px, 1.7vw, 7px) clamp(10px, 3vw, 11px)",
    background: `${color}1f`,
    color: "#f8fafc",
    border: `1px solid ${color}55`,
    fontSize: "clamp(0.74rem, 2vw, 0.8rem)"
  } as const;
}

const weaponInfoStyle = {
  display: "grid",
  gap: 4,
  padding: "clamp(10px, 2.8vw, 12px) clamp(12px, 3.4vw, 14px)",
  borderRadius: 18,
  border: "1px solid rgba(148, 163, 184, 0.12)",
  background: "rgba(15, 23, 42, 0.56)"
} as const;

function ammoBadgeStyle(color: string) {
  return {
    position: "absolute",
    top: "clamp(8px, 2.2vw, 10px)",
    left: "clamp(8px, 2.2vw, 10px)",
    borderRadius: 999,
    padding: "clamp(2px, 0.7vw, 3px) clamp(5px, 1.5vw, 6px)",
    minWidth: 0,
    textAlign: "center",
    background: `${color}1f`,
    border: `1px solid ${color}4d`,
    color: "#f8fafc",
    fontWeight: 800,
    fontSize: "clamp(0.62rem, 1.8vw, 0.68rem)",
    lineHeight: 1
  } as const;
}
