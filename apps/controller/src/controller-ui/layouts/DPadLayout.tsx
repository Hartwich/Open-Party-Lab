import { useEffect, useRef, useState } from "react";
import { ActionButtonPad } from "../common/ActionButtonPad.js";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { DPadLayoutModel } from "./models.js";

interface DPadLayoutProps {
  model: DPadLayoutModel;
}

type Direction = "up" | "down" | "left" | "right";

interface DirectionState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

function normalizeVector(state: DirectionState): { moveX: number; moveY: number } {
  const moveX = (state.right ? 1 : 0) - (state.left ? 1 : 0);
  const moveY = (state.down ? 1 : 0) - (state.up ? 1 : 0);
  const magnitude = Math.hypot(moveX, moveY);

  if (magnitude <= 1) {
    return { moveX, moveY };
  }

  return {
    moveX: moveX / magnitude,
    moveY: moveY / magnitude
  };
}

function DirectionButton({
  label,
  active,
  accentColor,
  round = false,
  size,
  onPressed,
  onReleased
}: {
  label: string;
  active: boolean;
  accentColor?: string;
  round?: boolean;
  size?: string;
  onPressed: () => void;
  onReleased: () => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onPressed();
      }}
      onPointerUp={onReleased}
      onPointerCancel={onReleased}
      onPointerLeave={onReleased}
      onLostPointerCapture={onReleased}
      style={{
        width: round ? size : undefined,
        height: round ? size : undefined,
        minHeight: round ? undefined : 108,
        aspectRatio: round ? "1 / 1" : undefined,
        borderRadius: round ? "50%" : 24,
        border: "1px solid var(--panel-border)",
        background: active
          ? accentColor ?? "linear-gradient(160deg, var(--accent) 0%, var(--accent-strong) 100%)"
          : "rgba(15, 23, 42, 0.72)",
        color: "var(--text-main)",
        fontSize: "clamp(1.1rem, 4vw, 1.65rem)",
        fontWeight: 900,
        letterSpacing: "0.08em",
        display: "grid",
        placeItems: "center",
        padding: round ? 0 : undefined,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        opacity: active ? 1 : 0.92
      }}
    >
      {label}
    </button>
  );
}

function InlineActionButton({
  label,
  accentColor,
  disabled,
  size,
  onPress,
  onRelease
}: {
  label: string;
  accentColor?: string;
  disabled: boolean;
  size: string;
  onPress: () => void;
  onRelease?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(event) => {
        if (disabled) {
          return;
        }

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress();
      }}
      onPointerUp={() => onRelease?.()}
      onPointerCancel={() => onRelease?.()}
      onLostPointerCapture={() => onRelease?.()}
      style={{
        width: size,
        height: size,
        aspectRatio: "1 / 1",
        borderRadius: "50%",
        border: "1px solid rgba(125, 211, 252, 0.3)",
        background: disabled
          ? "rgba(51, 65, 85, 0.86)"
          : `linear-gradient(180deg, ${accentColor ?? "#22d3ee"} 0%, rgba(8, 145, 178, 0.92) 100%)`,
        color: disabled ? "rgba(226, 232, 240, 0.72)" : "#f8fafc",
        fontSize: "clamp(1rem, 3.4vw, 1.45rem)",
        fontWeight: 900,
        letterSpacing: "0.04em",
        display: "grid",
        placeItems: "center",
        padding: 0,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none"
      }}
    >
      {label}
    </button>
  );
}

export function DPadLayout({ model }: DPadLayoutProps) {
  const [active, setActive] = useState<DirectionState>({
    up: false,
    down: false,
    left: false,
    right: false
  });
  const lastVectorRef = useRef<{ moveX: number; moveY: number }>({ moveX: 0, moveY: 0 });
  const onMoveChangeRef = useRef(model.onMoveChange);
  const actionButtons = model.actionButtons ?? [];
  const hasActionButtons = actionButtons.length > 0;
  const inlineActionButtons = model.horizontalOnly === true && model.inlineActionButtons === true && hasActionButtons;
  const showSeparateActionButtons = hasActionButtons && !inlineActionButtons;
  const buttonColumns = model.actionButtonColumns ?? (actionButtons.length >= 4 ? 2 : 1);
  const inlineDirectionSize = "clamp(96px, 28vw, 152px)";
  const inlineActionSize = "clamp(76px, 21vw, 118px)";
  const directionLabels: Record<Direction, string> = {
    up: model.directionLabels?.up ?? "UP",
    down: model.directionLabels?.down ?? "DOWN",
    left: model.directionLabels?.left ?? "LEFT",
    right: model.directionLabels?.right ?? "RIGHT"
  };

  useEffect(() => {
    onMoveChangeRef.current = model.onMoveChange;
  }, [model.onMoveChange]);

  useEffect(() => {
    setActive({ up: false, down: false, left: false, right: false });
    if (lastVectorRef.current.moveX !== 0 || lastVectorRef.current.moveY !== 0) {
      lastVectorRef.current = { moveX: 0, moveY: 0 };
      onMoveChangeRef.current(0, 0);
    }
  }, [model.resetKey, model.disabled]);

  useEffect(() => {
    return () => {
      if (lastVectorRef.current.moveX !== 0 || lastVectorRef.current.moveY !== 0) {
        lastVectorRef.current = { moveX: 0, moveY: 0 };
        onMoveChangeRef.current(0, 0);
      }
    };
  }, []);

  function emitMove(nextActive: DirectionState): void {
    const nextVector = normalizeVector(nextActive);

    if (
      lastVectorRef.current.moveX === nextVector.moveX &&
      lastVectorRef.current.moveY === nextVector.moveY
    ) {
      return;
    }

    lastVectorRef.current = nextVector;
    onMoveChangeRef.current(nextVector.moveX, nextVector.moveY);
  }

  function setDirection(direction: Direction, pressed: boolean): void {
    if (model.disabled) {
      return;
    }

    setActive((current) => {
      const nextState = { ...current, [direction]: pressed };
      emitMove(nextState);
      return nextState;
    });
  }

  const dpadControl = model.horizontalOnly ? (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: inlineActionButtons
          ? "auto auto auto"
          : "repeat(2, minmax(0, 1fr))",
        gap: inlineActionButtons ? 14 : 12,
        alignItems: "center",
        justifyContent: inlineActionButtons ? "center" : undefined,
        width: inlineActionButtons ? "min(94vw, 560px)" : "min(58vw, 360px)"
      }}
    >
      <DirectionButton
        label={directionLabels.left}
        active={active.left}
        accentColor={model.accentColor}
        round={inlineActionButtons}
        size={inlineDirectionSize}
        onPressed={() => setDirection("left", true)}
        onReleased={() => setDirection("left", false)}
      />
      {inlineActionButtons
        ? (
            <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
              {actionButtons.map((button) => (
                <InlineActionButton
                  key={button.id}
                  label={button.label}
                  accentColor={button.accentColor}
                  disabled={model.disabled || button.disabled === true}
                  size={inlineActionSize}
                  onPress={button.onPress}
                  onRelease={button.onRelease}
                />
              ))}
            </div>
          )
        : null}
      <DirectionButton
        label={directionLabels.right}
        active={active.right}
        accentColor={model.accentColor}
        round={inlineActionButtons}
        size={inlineDirectionSize}
        onPressed={() => setDirection("right", true)}
        onReleased={() => setDirection("right", false)}
      />
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 12,
        alignItems: "stretch",
        width: "min(52vw, 320px)"
      }}
    >
      <div />
      <DirectionButton
        label={directionLabels.up}
        active={active.up}
        accentColor={model.accentColor}
        onPressed={() => setDirection("up", true)}
        onReleased={() => setDirection("up", false)}
      />
      <div />

      <DirectionButton
        label={directionLabels.left}
        active={active.left}
        accentColor={model.accentColor}
        onPressed={() => setDirection("left", true)}
        onReleased={() => setDirection("left", false)}
      />

      <div
        style={{
          display: "grid",
          placeItems: "center",
          borderRadius: 24,
          border: "1px solid var(--panel-border)",
          background: "rgba(15, 23, 42, 0.52)",
          color: "var(--text-muted)",
          fontWeight: 800,
          letterSpacing: "0.12em"
        }}
      >
        MOVE
      </div>

      <DirectionButton
        label={directionLabels.right}
        active={active.right}
        accentColor={model.accentColor}
        onPressed={() => setDirection("right", true)}
        onReleased={() => setDirection("right", false)}
      />

      <div />
      <DirectionButton
        label={directionLabels.down}
        active={active.down}
        accentColor={model.accentColor}
        onPressed={() => setDirection("down", true)}
        onReleased={() => setDirection("down", false)}
      />
      <div />
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {!model.hideHeader ? (
        <div
          style={{
            display: "grid",
            gap: 8,
            padding: 18,
            borderRadius: 20,
            border: "1px solid var(--panel-border)",
            background: "rgba(8, 47, 73, 0.28)"
          }}
        >
          <strong style={{ fontSize: "1.25rem", color: model.accentColor ?? "var(--accent)" }}>{model.title}</strong>
          {model.subtitle ? <span style={{ color: "var(--text-muted)" }}>{model.subtitle}</span> : null}
          {model.helperText ? <span style={{ color: "var(--text-muted)" }}>{model.helperText}</span> : null}
        </div>
      ) : null}

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: showSeparateActionButtons ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)",
          gap: 16,
          alignItems: "center"
        }}
      >
        <div style={{ display: "grid", justifyItems: showSeparateActionButtons ? "start" : "center" }}>{dpadControl}</div>
        {showSeparateActionButtons ? (
          <ActionButtonPad
            buttons={actionButtons}
            disabled={model.disabled}
            columns={buttonColumns}
            buttonSize={actionButtons.length >= 4 ? "min(19vw, 96px)" : "min(34vw, 180px)"}
          />
        ) : null}
      </div>

      {model.stats?.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {model.stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: stat.highlighted ? "rgba(34, 211, 238, 0.16)" : "rgba(15, 23, 42, 0.52)"
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
