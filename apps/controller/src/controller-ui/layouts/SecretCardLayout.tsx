import { useEffect, useRef, useState } from "react";
import type {
  SecretCardActionModel,
  SecretCardLayoutModel,
  SecretCardRoleTone
} from "./models.js";
import { ReadyPanel } from "../common/ReadyPanel.js";

interface SecretCardLayoutProps {
  model: SecretCardLayoutModel;
}

const ROLE_TONES: Record<SecretCardRoleTone, { bg: string; border: string; text: string }> = {
  primary: { bg: "color-mix(in srgb, var(--sage) 16%, transparent)", border: "color-mix(in srgb, var(--sage) 55%, transparent)", text: "var(--sage-soft)" },
  watch: { bg: "color-mix(in srgb, var(--danger) 16%, transparent)", border: "color-mix(in srgb, var(--danger) 55%, transparent)", text: "var(--danger-soft)" },
  guess: { bg: "color-mix(in srgb, var(--accent) 16%, transparent)", border: "color-mix(in srgb, var(--accent) 55%, transparent)", text: "var(--accent-soft)" },
  bench: { bg: "color-mix(in srgb, var(--muted) 14%, transparent)", border: "color-mix(in srgb, var(--muted) 40%, transparent)", text: "var(--ink-soft)" }
};

const ACTION_TONES = {
  positive: { bg: "linear-gradient(180deg, var(--sage), var(--sage))", border: "var(--sage)", text: "var(--sage-soft)" },
  neutral: { bg: "linear-gradient(180deg, var(--line-strong), var(--surface-raised))", border: "var(--muted)", text: "var(--ink-soft)" },
  danger: { bg: "linear-gradient(180deg, var(--danger), var(--danger))", border: "var(--danger-soft)", text: "var(--danger-soft)" }
} as const;

/**
 * Zaehlt lokal weiter, damit der Timer fluessig laeuft und nicht nur bei
 * Server-Updates springt.
 */
function useSmoothCountdown(remainingMs: number | null | undefined): number | null {
  const [value, setValue] = useState<number | null>(remainingMs ?? null);
  const targetRef = useRef<number | null>(null);

  useEffect(() => {
    if (remainingMs === null || remainingMs === undefined) {
      targetRef.current = null;
      setValue(null);
      return;
    }

    targetRef.current = Date.now() + remainingMs;
    setValue(remainingMs);
  }, [remainingMs]);

  useEffect(() => {
    const handle = window.setInterval(() => {
      const target = targetRef.current;

      if (target === null) {
        return;
      }

      setValue(Math.max(0, target - Date.now()));
    }, 100);

    return () => window.clearInterval(handle);
  }, []);

  return value;
}

function TimerRing({ remainingMs, durationMs }: { remainingMs: number | null; durationMs: number }) {
  const safeDuration = Math.max(1, durationMs);
  const remaining = remainingMs ?? safeDuration;
  const ratio = Math.max(0, Math.min(1, remaining / safeDuration));
  const seconds = Math.ceil(remaining / 1000);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const urgent = remaining <= 10_000;
  const stroke = urgent ? "var(--danger)" : ratio > 0.4 ? "var(--sage)" : "var(--amber)";

  return (
    <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
      <svg width={80} height={80} viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={40} cy={40} r={radius} fill="none" stroke="color-mix(in srgb, var(--muted) 22%, transparent)" strokeWidth={7} />
        <circle
          cx={40}
          cy={40}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: "stroke-dashoffset 120ms linear, stroke 300ms ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontSize: "1.6rem",
          fontWeight: 700,
          color: stroke,
          fontVariantNumeric: "tabular-nums"
        }}
      >
        {seconds}
      </div>
    </div>
  );
}

function ActionButton({ action, disabled }: { action: SecretCardActionModel; disabled: boolean }) {
  const tone = ACTION_TONES[action.tone];
  const isDisabled = disabled || action.disabled;

  return (
    <button
      type="button"
      onClick={action.onPress}
      disabled={isDisabled}
      style={{
        width: "100%",
        minHeight: 64,
        border: `1px solid ${tone.border}`,
        borderRadius: "var(--radius-lg)",
        background: tone.bg,
        color: tone.text,
        fontSize: "1.1rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
        display: "grid",
        gap: 2,
        placeContent: "center",
        opacity: isDisabled ? 0.4 : 1,
        boxShadow: isDisabled ? "none" : "var(--button-shadow)",
        transition: "opacity 150ms ease, transform 120ms ease",
        touchAction: "manipulation"
      }}
    >
      <span>{action.label}</span>
      {action.sublabel ? (
        <span style={{ fontSize: "0.78rem", fontWeight: 500, opacity: 0.85 }}>{action.sublabel}</span>
      ) : null}
    </button>
  );
}

export function SecretCardLayout({ model }: SecretCardLayoutProps) {
  const timerValue = useSmoothCountdown(model.timer?.remainingMs);
  const countdownValue = useSmoothCountdown(model.countdownMs);
  const roleTone = ROLE_TONES[model.roleTone];
  const countdownSeconds = countdownValue === null ? null : Math.ceil(countdownValue / 1000);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "grid", gap: 4, flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "3px 9px",
                borderRadius: 999,
                background: roleTone.bg,
                border: `1px solid ${roleTone.border}`,
                color: roleTone.text
              }}
            >
              {model.roleLabel}
            </span>
            {model.statusLabel ? (
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{model.statusLabel}</span>
            ) : null}
          </div>
          {model.subtitle ? (
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: "0.88rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {model.subtitle}
            </span>
          ) : null}
        </div>
        {model.timer ? <TimerRing remainingMs={timerValue} durationMs={model.timer.durationMs} /> : null}
      </header>

      {countdownSeconds !== null && countdownSeconds > 0 ? (
        <div
          style={{
            display: "grid",
            placeItems: "center",
            padding: "10px 0",
            borderRadius: "var(--radius-lg)",
            background: "color-mix(in srgb, var(--surface) 55%, transparent)",
            border: "1px dashed var(--panel-border)"
          }}
        >
          <span style={{ fontSize: "2.6rem", fontWeight: 800, lineHeight: 1, color: "var(--accent)" }}>
            {countdownSeconds}
          </span>
        </div>
      ) : null}

      {model.card ? (
        <section
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid color-mix(in srgb, var(--muted) 35%, transparent)",
            background: "linear-gradient(165deg, var(--ink) 0%, var(--ink-soft) 100%)",
            color: "var(--ink-soft)",
            padding: "16px 16px 14px",
            boxShadow: "0 12px 30px color-mix(in srgb, var(--paper) 45%, transparent)"
          }}
        >
          {model.card.tag ? (
            <span
              style={{
                fontSize: "0.66rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--muted)"
              }}
            >
              {model.card.tag}
            </span>
          ) : null}
          <div
            style={{
              fontSize: "clamp(1.7rem, 8vw, 2.3rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: "4px 0 12px",
              wordBreak: "break-word"
            }}
          >
            {model.card.term}
          </div>
          <div style={{ height: 1, background: "color-mix(in srgb, var(--surface) 14%, transparent)", margin: "0 0 10px" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {model.card.forbidden.map((word) => (
              <span
                key={word}
                style={{
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)",
                  color: "var(--danger)",
                  textDecoration: "line-through",
                  textDecorationThickness: "1.5px"
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </section>
      ) : model.hiddenCardHint ? (
        <section
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--panel-border)",
            background:
              "repeating-linear-gradient(135deg, color-mix(in srgb, var(--surface-raised) 75%, transparent) 0 10px, color-mix(in srgb, var(--surface) 75%, transparent) 10px 20px)",
            padding: "22px 16px",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            minHeight: 96
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.4 }}>
            {model.hiddenCardHint}
          </span>
        </section>
      ) : null}

      {model.helperText ? (
        <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.45, fontSize: "0.92rem" }}>
          {model.helperText}
        </p>
      ) : null}

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      {model.actions?.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {model.actions.map((action) => (
            <ActionButton key={action.id} action={action} disabled={model.disabled} />
          ))}
        </div>
      ) : null}

      {model.targets?.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {model.targetsTitle ? (
            <strong style={{ fontSize: "0.82rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
              {model.targetsTitle}
            </strong>
          ) : null}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
            {model.targets.map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={target.onSelect}
                disabled={model.disabled || target.disabled}
                style={{
                  minHeight: 54,
                  border: "1px solid color-mix(in srgb, var(--sage) 45%, transparent)",
                  borderRadius: "var(--radius-md)",
                  background: "color-mix(in srgb, var(--sage-strong) 28%, transparent)",
                  color: "var(--text-main)",
                  fontWeight: 600,
                  fontSize: "0.98rem",
                  padding: "8px 10px",
                  opacity: model.disabled || target.disabled ? 0.42 : 1,
                  touchAction: "manipulation"
                }}
              >
                {target.name}
                {target.hint ? (
                  <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {target.hint}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {model.scoreRows?.length ? (
        <div style={{ display: "grid", gap: 6 }}>
          {model.scoreRows.map((row) => (
            <div
              key={row.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                background: row.highlighted ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "color-mix(in srgb, var(--surface) 52%, transparent)",
                border: `1px solid ${row.highlighted ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "transparent"}`,
                borderLeft: `3px solid ${row.accentColor ?? "color-mix(in srgb, var(--muted) 35%, transparent)"}`,
                borderRadius: "var(--radius-md)",
                padding: "9px 12px"
              }}
            >
              <span style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {row.label}
              </span>
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{row.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {model.stats?.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))", gap: 8 }}>
          {model.stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "color-mix(in srgb, var(--surface) 52%, transparent)",
                borderRadius: "var(--radius-md)",
                padding: "8px 10px",
                display: "grid",
                gap: 2
              }}
            >
              <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{stat.label}</span>
              <strong style={{ fontSize: "1rem", color: stat.highlighted ? "var(--accent)" : undefined }}>
                {stat.value}
              </strong>
            </div>
          ))}
        </div>
      ) : null}

      {model.feed?.length ? (
        <div style={{ display: "grid", gap: 5 }}>
          {model.feedTitle ? (
            <strong style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{model.feedTitle}</strong>
          ) : null}
          {model.feed.map((entry) => (
            <span
              key={entry.id}
              style={{
                fontSize: "0.85rem",
                color:
                  entry.tone === "positive"
                    ? "var(--sage-soft)"
                    : entry.tone === "danger"
                      ? "var(--danger-soft)"
                      : "var(--text-muted)"
              }}
            >
              {entry.text}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
