import { useMemo } from "react";

/** Seeded RNG (same technique as the reference scene). */
function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Generates a static pine-forest silhouette strip, adapted from the reference. */
function pineStrip(seed: number, count: number, minH: number, maxH: number, fill: string, opacity: number): string {
  const r = rng(seed);
  const H = 420;
  const W = 1200;
  let d = "";

  for (let i = 0; i < count; i++) {
    const x = 50 + (i * (W - 100)) / count + r() * 26;
    const h = minH + r() * (maxH - minH);
    const w = h * 0.3;

    for (let k = 0; k < 4; k++) {
      const ty = H - h + (k * h * 0.2);
      const hw = w * (0.34 + k * 0.2);
      d += `M${x} ${ty}L${x + hw} ${ty + h * 0.34}L${x - hw} ${ty + h * 0.34}Z`;
    }

    d += `M${x - 4} ${H}V${H - h * 0.2}H${x + 4}V${H}Z`;
  }

  return `<svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice"><path d="${d}" fill="${fill}" opacity="${opacity}"/><rect y="408" width="1200" height="12" fill="${fill}" opacity="${opacity}"/></svg>`;
}

const NEN_COLORS = ["#35d07f", "#38bdf8", "#ff5a5f", "#ff9650", "#a78bfa", "#f472b6"];

const FLOATING_CARDS = [
  { left: "8%", top: "12vh", r: "-12deg", d: "0s", c: 0 },
  { left: "80%", top: "9vh", r: "8deg", d: "-3s", c: 1 },
  { left: "62%", top: "24vh", r: "-6deg", d: "-5s", c: 2 },
  { left: "20%", top: "30vh", r: "10deg", d: "-2s", c: 4 },
  { left: "88%", top: "34vh", r: "-14deg", d: "-6s", c: 5 }
];

/**
 * Lightweight Hunter × Hunter backdrop for phones.
 *
 * The same visual language as the reference scene (Greed-Island sunset,
 * sun, light rays, floating cards, airship, pine forest, mist, path) but
 * rendered with CSS animations only — no requestAnimationFrame loop, no
 * canvas — so it stays smooth on low-end devices. The walking hero and
 * Nen particles are reserved for the desktop host scene.
 */
export function HunterScene() {
  const layers = useMemo(
    () => ({
      far: pineStrip(7, 22, 90, 170, "#2f7d60", 0.6),
      near: pineStrip(19, 14, 140, 260, "#0d3326", 0.9)
    }),
    []
  );

  return (
    <div className="hxh-backdrop" aria-hidden="true">
      <div className="hxhs-rays" />
      <div className="hxhs-sun" />
      {FLOATING_CARDS.map((card, index) => (
        <span
          key={index}
          className="hxhs-gcard"
          style={{
            left: card.left,
            top: card.top,
            ["--r" as string]: card.r,
            ["--d" as string]: card.d,
            ["--c" as string]: NEN_COLORS[card.c]
          }}
        />
      ))}
      <svg className="hxhs-ship" viewBox="0 0 230 90">
        <g fill="#0b241b" stroke="#3ddc97" strokeOpacity=".4">
          <ellipse cx="112" cy="34" rx="92" ry="26" />
          <path d="M26 30 L4 10 L4 54 L26 40Z" />
          <rect x="92" y="58" width="48" height="14" rx="4" />
        </g>
        <g fill="#ffd27a">
          <circle cx="100" cy="65" r="2" />
          <circle cx="112" cy="65" r="2" />
          <circle cx="124" cy="65" r="2" />
        </g>
      </svg>
      <svg className="hxhs-tree" viewBox="0 0 400 600">
        <defs>
          <radialGradient id="hxhs-tg">
            <stop offset="0" stopColor="#ffc15a" stopOpacity=".55" />
            <stop offset="1" stopColor="#2fb383" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="200" cy="170" rx="200" ry="150" fill="url(#hxhs-tg)" />
        <path
          d="M178 600 C186 470 170 380 150 300 C100 290 40 250 36 190 C34 120 100 70 170 78 C210 30 290 40 316 100 C380 120 392 200 340 250 C310 285 262 292 238 300 C226 380 214 470 222 600Z"
          fill="#0f3a2c"
        />
      </svg>
      <div className="hxhs-layer hxhs-far" dangerouslySetInnerHTML={{ __html: layers.far }} />
      <div className="hxhs-mist hxhs-mist-a" />
      <div className="hxhs-layer hxhs-near" dangerouslySetInnerHTML={{ __html: layers.near }} />
      <div className="hxhs-mist hxhs-mist-b" />
      <div className="hxhs-ground" />
      <div className="hxhs-path" />
      <div className="hxhs-vig" />
    </div>
  );
}
