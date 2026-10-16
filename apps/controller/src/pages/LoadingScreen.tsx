import { useEffect, useRef, useState } from "react";
import { LDC_CLUB } from "@open-party-lab/game-core";
import { HunterScene } from "./HunterScene.js";

interface LoadingScreenProps {
  /** True once the app is actually initialized (socket connected). */
  ready: boolean;
  /** Failsafe: never show loading longer than this. Defaults to 9s. */
  maxWaitMs?: number;
  onDone: () => void;
}

const NEN_PHASES = [
  { kanji: "纏", name: "Ten" },
  { kanji: "絶", name: "Zetsu" },
  { kanji: "練", name: "Ren" },
  { kanji: "発", name: "Hatsu" }
] as const;

const LOAD_MESSAGES = [
  "Ten — preparing your adventure…",
  "Zetsu — entering the Hunter Association…",
  "Ren — calling the hunters together…",
  "Hatsu — unleashing your ability…",
  "Your journey begins here."
] as const;

function messageFor(progress: number): string {
  if (progress < 25) return LOAD_MESSAGES[0];
  if (progress < 50) return LOAD_MESSAGES[1];
  if (progress < 75) return LOAD_MESSAGES[2];
  if (progress < 100) return LOAD_MESSAGES[3];
  return LOAD_MESSAGES[4];
}

/**
 * Cinematic Welcome Day loading screen.
 *
 * Progress is driven by the real `ready` signal (socket connected): it eases
 * toward 90% while waiting and completes when ready arrives. A `maxWaitMs`
 * failsafe guarantees the screen always resolves — nobody stares at an
 * endless loader on a bad network.
 */
export function LoadingScreen({ ready, maxWaitMs = 9000, onDone }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const startedAt = Date.now();
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const elapsed = Date.now() - startedAt;

      setProgress((current) => {
        if (ready) {
          return 100;
        }

        if (elapsed >= maxWaitMs) {
          return 100;
        }

        // Ease toward 90% while waiting for the real signal.
        return current + (90 - current) * (1 - Math.exp(-dt * 2.2));
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, maxWaitMs]);

  useEffect(() => {
    if (progress < 100 || doneRef.current) {
      return;
    }

    doneRef.current = true;
    const timer = window.setTimeout(() => onDoneRef.current(), 650);
    return () => window.clearTimeout(timer);
  }, [progress]);

  const rounded = Math.round(progress);
  const activePhase = rounded >= 100 ? 3 : Math.min(3, Math.floor(rounded / 25));

  return (
    <div className="hxh-scope hxh-loading" role="status" aria-label="Loading LDC Welcome Day">
      <HunterScene />
      <div className="hxh-content" style={{ width: "100%", maxWidth: 560, display: "grid", gap: "clamp(16px, 3.4vh, 28px)" }}>
      <div className="hxh-card">
        <i className="hxh-corner hxh-c1" aria-hidden="true" />
        <i className="hxh-corner hxh-c2" aria-hidden="true" />
        <i className="hxh-corner hxh-c3" aria-hidden="true" />
        <i className="hxh-corner hxh-c4" aria-hidden="true" />
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center" }}>
          <div className="hxh-brand">
            <span className="hxh-logo-frame">
              <img src={`${import.meta.env.BASE_URL}ldc-logo.jpg`} alt={`${LDC_CLUB.name} logo`} />
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="hxh-club">LDC — ESTIN</p>
            <h1 className="hxh-title">
              Hunter <span className="hxh-x">×</span> Hunter
            </h1>
            <p className="hxh-subtitle">LDC Welcome Day</p>
          </div>
        </div>
        <div className="hxh-strip" style={{ marginTop: 14 }}>
          <span>Entry Pass</span>
        </div>
      </div>

      <div style={{ width: "100%" }}>
        <div className="hxh-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={rounded} aria-label="Loading">
          <div className="hxh-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="hxh-load-row">
          <span className="hxh-load-msg" aria-live="polite">{messageFor(rounded)}</span>
          <span className="hxh-load-pct">{rounded}%</span>
        </div>
        <div className="hxh-phases" aria-hidden="true">
          {NEN_PHASES.map((phase, index) => (
            <span key={phase.name} className={index <= activePhase ? "on" : undefined}>
              <b>{phase.kanji}</b>
              {phase.name}
            </span>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
