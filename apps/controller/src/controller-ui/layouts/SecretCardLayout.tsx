import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { SecretCardLayoutModel } from "./models.js";
import { ReadyPanel } from "../common/ReadyPanel.js";
import "./secretCardLayout.css";

function SecretCardTimer({
  duration, remaining, preview
}: {
  duration: number;
  remaining: number;
  preview: boolean;
}) {
  const [left, setLeft] = useState(remaining);
  useEffect(() => {
    const deadline = performance.now() + remaining;
    setLeft(remaining);
    const handle = window.setInterval(() => setLeft(Math.max(0, deadline - performance.now())), 100);
    return () => window.clearInterval(handle);
  }, [remaining]);

  const progress = `${Math.min(1, left / Math.max(1, duration))}turn`;
  const tone = preview ? "preview" : left <= 10_000 ? "urgent" : "active";
  return (
    <div className="sc-clock" data-tone={tone} style={{ "--sc-progress": progress } as CSSProperties}>
      <strong>{Math.ceil(left / 1000)}<small> s</small></strong>
    </div>
  );
}

export function SecretCardLayout({ model }: { model: SecretCardLayoutModel }) {
  const preview = model.countdownMs != null;
  const remaining = model.countdownMs ?? model.timer?.remainingMs;

  return (
    <div className="sc-layout" data-role={model.roleTone}>
      <header className="sc-header">
        <div>
          <h1>{model.title}</h1>
          <div className="sc-role-line">
            <strong className="sc-role">{model.roleLabel}</strong>
            {model.statusLabel ? <span>{model.statusLabel}</span> : null}
          </div>
          {model.subtitle ? <p className="sc-subtitle">{model.subtitle}</p> : null}
        </div>
        {remaining != null ? (
          <SecretCardTimer key={preview ? "preview" : "turn"} preview={preview}
            remaining={remaining} duration={preview ? 4000 : model.timer?.durationMs ?? remaining} />
        ) : null}
      </header>

      {model.card ? (
        <section className="sc-card">
          {model.card.tag && <p className="sc-card-label">{model.card.tag}</p>}
          <h2>{model.card.term}</h2>
          {model.card.forbidden.length > 0 ? (
            <>
              {model.card.forbiddenLabel ? <p className="sc-card-label">{model.card.forbiddenLabel}</p> : null}
              <ul className="sc-forbidden">
                {model.card.forbidden.map((word) => <li key={word}>{word}</li>)}
              </ul>
            </>
          ) : null}
        </section>
      ) : model.hiddenCardHint ? <p className="sc-hidden">{model.hiddenCardHint}</p> : null}

      {model.ready ? <ReadyPanel ready={model.ready} /> : null}

      {model.actions?.length ? (
        <div className="sc-actions">
          {model.actions.map((action) => (
            <button className="sc-action" data-tone={action.tone} type="button" key={action.id}
              onClick={action.onPress} disabled={model.disabled || action.disabled}>
              <strong>{action.label}</strong>
              {action.sublabel ? <span>{action.sublabel}</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      {model.targets?.length ? (
        <section className="sc-targets">
          {model.targetsTitle ? <h2>{model.targetsTitle}</h2> : null}
          <div className="sc-target-grid">
            {model.targets.map((target) => (
              <button className="sc-action sc-target" type="button" key={target.id}
                onClick={target.onSelect} disabled={model.disabled || target.disabled}>
                <strong>{target.name}</strong>
                {target.hint ? <span>{target.hint}</span> : null}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {model.helperText ? <p className="sc-help">{model.helperText}</p> : null}

      {model.stats?.length ? (
        <dl className="sc-stats">
          {model.stats.map((stat) => (
            <div key={stat.label} data-highlighted={stat.highlighted}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {model.scoreRows?.length ? (
        <ul className="sc-scores">
          {model.scoreRows.map((row) => (
            <li key={row.id} data-highlighted={row.highlighted}
              style={{ "--sc-score-color": row.accentColor } as CSSProperties}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </li>
          ))}
        </ul>
      ) : null}

      {model.feed?.length ? (
        <section className="sc-feed">
          {model.feedTitle ? <h2>{model.feedTitle}</h2> : null}
          <ul>
            {model.feed.map((entry) => <li key={entry.id} data-tone={entry.tone}>{entry.text}</li>)}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
