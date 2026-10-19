import type { ClientToServerEvents, ServerToClientEvents, SupportedLanguage } from "@open-party-lab/protocol";
import { defaultThemeName, themeCssVariablesFor } from "@open-party-lab/ui-kit";
import { io, type Socket } from "socket.io-client";
import { readStoredHostLanguage, writeStoredHostLanguage } from "../i18n/hostText.js";

/**
 * Serialises the theme tokens into a `:root { … }` declaration block.
 *
 * The landing page has no room yet, so it always uses the default theme.
 */
function themeRootBlock(): string {
  return Object.entries(themeCssVariablesFor(defaultThemeName))
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
}

const landingText = {
  en: {
    title: "LDC Club Party – Start a room",
    kicker: "YOUR SCREEN. YOUR PHONES. ONE ROOM.",
    heading: "The party starts",
    headingAccent: "with your room.",
    intro: "Create a new game room on this screen or join an existing room with your phone.",
    create: "Create a new room",
    createHint: "This screen becomes the host",
    or: "or",
    join: "Join an existing room",
    roomCode: "ROOM CODE",
    joinButton: "Join",
    joinHint: "This opens the phone controller for the room.",
    ready: "Ready.",
    creating: "Creating room …",
    unavailable: "The server is currently unavailable. Please try again.",
    invalidCode: "Please enter the four-character room code.",
    closedInactive: "The previous room was closed after ten minutes without activity.",
    closedExpired: "The previous room was closed automatically after one hour.",
    closedCapacity: "The previous room had no active players and was closed to make space for a new room.",
    switchLanguage: "English"
  }
} as const;

function normalizeRoomCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
}

export function mountHostedLanding(): void {
  let language: SupportedLanguage = readStoredHostLanguage();
  const closedReason = new URLSearchParams(window.location.search).get("closed");
  document.title = landingText[language].title;
  document.body.classList.add("hosted-landing-page");

  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  app.innerHTML = `
    <main class="hosted-landing">
      <div class="hosted-scene" aria-hidden="true">
        <div class="hosted-rays"></div>
        <div class="hosted-sun"></div>
        <span class="hosted-gcard" style="left:62%;top:9%;--r:-12deg;--d:0s;--c:#35d07f"></span>
        <span class="hosted-gcard" style="left:74%;top:22%;--r:8deg;--d:-3s;--c:#38bdf8"></span>
        <span class="hosted-gcard" style="left:48%;top:5%;--r:15deg;--d:-5s;--c:#ff5a5f"></span>
        <span class="hosted-gcard" style="left:88%;top:12%;--r:-6deg;--d:-7s;--c:#ff9650"></span>
        <span class="hosted-gcard" style="left:26%;top:26%;--r:10deg;--d:-2s;--c:#a78bfa"></span>
        <span class="hosted-gcard" style="left:3%;top:30%;--r:-14deg;--d:-6s;--c:#f472b6"></span>
        <svg class="hosted-ship" viewBox="0 0 230 90"><g fill="#0b241b" stroke="#3ddc97" stroke-opacity=".4"><ellipse cx="112" cy="34" rx="92" ry="26"/><path d="M26 30 L4 10 L4 54 L26 40Z"/><rect x="92" y="58" width="48" height="14" rx="4"/><path d="M96 58 L100 52 M134 58 L130 52"/></g><g fill="#ffd27a"><circle cx="100" cy="65" r="2"/><circle cx="112" cy="65" r="2"/><circle cx="124" cy="65" r="2"/><circle cx="40" cy="34" r="1.6"/><circle cx="184" cy="34" r="1.6"/></g></svg>
        <svg class="hosted-birds" viewBox="0 0 100 40"><path d="M4 18 q7 -9 14 0 q7 -9 14 0"/><path d="M40 8 q6 -8 12 0 q6 -8 12 0"/><path d="M62 26 q5 -7 10 0 q5 -7 10 0"/></svg>
        <svg class="hosted-tree" viewBox="0 0 400 600"><defs><radialGradient id="hosted-tg"><stop offset="0" stop-color="#ffc15a" stop-opacity=".55"/><stop offset="1" stop-color="#2fb383" stop-opacity="0"/></radialGradient></defs><ellipse cx="200" cy="170" rx="200" ry="150" fill="url(#hosted-tg)"/><path d="M178 600 C186 470 170 380 150 300 C100 290 40 250 36 190 C34 120 100 70 170 78 C210 30 290 40 316 100 C380 120 392 200 340 250 C310 285 262 292 238 300 C226 380 214 470 222 600Z" fill="#0f3a2c"/><g fill="#2fb383" opacity=".4"><circle cx="110" cy="150" r="2.4"/><circle cx="240" cy="110" r="2"/><circle cx="300" cy="190" r="2.6"/><circle cx="170" cy="210" r="2"/><circle cx="80" cy="210" r="2"/><circle cx="260" cy="250" r="2.2"/></g></svg>
        <svg class="hosted-tower" viewBox="0 0 120 400"><path d="M10 400 V330 H24 V270 H36 V210 H46 V150 H54 V100 H58 V50 H60 V20 H62 V50 H66 V100 H74 V150 H84 V210 H96 V270 H108 V330 H112 V400Z" fill="#0d3326"/><g fill="#ffd27a" opacity=".7"><rect x="56" y="120" width="3" height="4"/><rect x="62" y="120" width="3" height="4"/><rect x="50" y="180" width="3" height="4"/><rect x="66" y="180" width="3" height="4"/><rect x="42" y="240" width="3" height="4"/><rect x="74" y="240" width="3" height="4"/><rect x="34" y="300" width="3" height="4"/><rect x="82" y="300" width="3" height="4"/></g></svg>
        <div class="hosted-layer" id="hosted-L0"></div>
        <div class="hosted-mist" style="bottom:20%"></div>
        <div class="hosted-layer" id="hosted-L1"></div>
        <div class="hosted-mist" style="bottom:12%;animation-duration:30s"></div>
        <div class="hosted-layer" id="hosted-L2"></div>
        <div class="hosted-ground"></div>
        <div class="hosted-path"></div>
        <div class="hosted-dash" id="hosted-dash"></div>
        <div class="hosted-hero-wrap" id="hosted-hero-wrap"><div class="hosted-aura" id="hosted-aura"></div>
          <svg class="hosted-hero" viewBox="0 0 200 400">
            <defs><linearGradient id="hosted-cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4a39"/><stop offset="1" stop-color="#07110d"/></linearGradient></defs>
            <ellipse class="sh" cx="100" cy="394" rx="54" ry="6"/>
            <g id="hosted-hLf"><path class="f" d="M-13 0 C-15 30 -12 60 -9 82 L9 82 C11 60 14 30 13 0Z"/><g id="hosted-hKf" transform="translate(0,82)"><path class="f" d="M-9 0 C-10 24 -8 50 -6 80 L6 80 C8 50 10 24 9 0Z"/><g id="hosted-hAf" transform="translate(0,80)"><path class="f" d="M-9 -6 L-10 20 L26 20 C35 20 36 12 28 10 L9 6 L8 -6Z"/></g></g></g>
            <g id="hosted-hBd">
              <g id="hosted-hUf" transform="translate(-2,-96)"><path class="f" d="M-8 0 C-9 20 -8 40 -6 58 L6 58 C8 40 9 20 8 0Z"/><g id="hosted-hFf" transform="translate(0,58)"><path class="f" d="M-6 0 C-7 20 -6 38 -4 54 L5 54 C7 38 8 20 6 0Z"/><circle class="f" cx="0" cy="58" r="6"/></g></g>
              <path class="p" d="M-22 -92 C-48 -92 -52 -40 -43 -12 L-22 -16Z"/><path class="p" d="M-20 -96 C-6 -80 4 -58 12 -40" fill="none"/>
              <path class="p" d="M-24 0 C-28 -30 -26 -70 -22 -98 C-18 -108 -8 -112 0 -112 C10 -112 20 -108 24 -98 C28 -70 26 -30 24 0 Z"/>
              <rect class="gold" x="-25" y="-12" width="50" height="6" rx="2"/><rect class="gold" x="4" y="-14" width="10" height="10" rx="2"/>
              <polygon class="p" id="hosted-hSc" points="0,0"/>
              <g id="hosted-hHd" transform="translate(4,-112)"><path class="p" d="M-7 6 L-6 -6 L8 -6 L8 6Z"/>
                <g transform="translate(6,-28)"><ellipse class="p" cx="0" cy="0" rx="19" ry="23"/><path class="p" d="M18 -6 L27 3 L18 7Z"/><path class="p" d="M-8 -2 C-14 -2 -14 8 -8 8" fill="none"/>
                <g id="hosted-hHr"><path class="p" d="M-19 -4 L-34 -30 L-16 -22 L-16 -50 L-3 -28 L8 -54 L12 -26 L26 -40 L21 -10 Z"/></g></g></g>
              <g id="hosted-hUn" transform="translate(2,-96)"><path class="p" d="M-8 0 C-9 20 -8 40 -6 58 L6 58 C8 40 9 20 8 0Z"/><g id="hosted-hFn" transform="translate(0,58)"><path class="p" d="M-6 0 C-7 20 -6 38 -4 54 L5 54 C7 38 8 20 6 0Z"/><circle class="p" cx="0" cy="58" r="6"/></g></g>
            </g>
            <g id="hosted-hLn"><path class="p" d="M-13 0 C-15 30 -12 60 -9 82 L9 82 C11 60 14 30 13 0Z"/><g id="hosted-hKn" transform="translate(0,82)"><path class="p" d="M-9 0 C-10 24 -8 50 -6 80 L6 80 C8 50 10 24 9 0Z"/><rect class="gold" x="-9" y="60" width="18" height="4" rx="2"/><g id="hosted-hAn" transform="translate(0,80)"><path class="p" d="M-9 -6 L-10 20 L26 20 C35 20 36 12 28 10 L9 6 L8 -6Z"/></g></g></g>
          </svg>
        </div>
        <div class="hosted-layer" id="hosted-L3"></div>
        <canvas id="hosted-fx"></canvas>
        <div class="hosted-vig"></div>
        <svg class="hosted-nenwheel" viewBox="-210 -210 420 420" fill="none" stroke="#e8bd4f" stroke-width="1.2"><polygon points="0,-150 130,-75 130,75 0,150 -130,75 -130,-75"/><polygon points="0,-100 87,-50 87,50 0,100 -87,50 -87,-50" stroke-opacity=".6"/><path d="M0 -150V150M-130 -75L130 75M130 -75L-130 75" stroke-opacity=".5"/><circle r="150" stroke-opacity=".35"/><circle r="172" stroke-opacity=".25" stroke-dasharray="3 7"/><g stroke="none"><circle cx="0" cy="-150" r="11" fill="#35d07f"/><circle cx="130" cy="-75" r="11" fill="#38bdf8"/><circle cx="130" cy="75" r="11" fill="#ff5a5f"/><circle cx="0" cy="150" r="11" fill="#ff9650"/><circle cx="-130" cy="75" r="11" fill="#f472b6"/><circle cx="-130" cy="-75" r="11" fill="#a78bfa"/></g></svg>
      </div>
      <section class="hosted-hero" aria-labelledby="landing-title">
        <div class="hosted-topbar"><div class="hosted-brand"><img src="./ldc-logo.jpg" alt="LDC Club logo" /><span><strong>LDC — ESTIN</strong><small>Welcome Day · Hunter × Hunter</small></span></div><button class="hosted-language" type="button">DE / EN</button></div>
        <div class="hosted-card">
          <p class="hosted-kicker" data-text="kicker">DEIN BILDSCHIRM. EURE HANDYS. EIN RAUM.</p>
          <h1 id="landing-title"><span data-text="heading">Die Party beginnt</span><br><em data-text="headingAccent">mit deinem Raum.</em></h1>
          <p class="hosted-intro" data-text="intro">Erstelle einen neuen Spielraum auf diesem Bildschirm oder tritt mit deinem Handy einem bestehenden Raum bei.</p>
          <div class="hosted-actions">
            <button class="hosted-create" type="button">
              <span data-text="create">Neuen Raum erstellen</span>
              <small data-text="createHint">Dieser Bildschirm wird zum Host</small>
            </button>
            <span class="hosted-or" data-text="or">oder</span>
            <form class="hosted-join">
              <label for="hosted-room-code" data-text="join">Bestehendem Raum beitreten</label>
              <div>
                <input id="hosted-room-code" name="room" inputmode="text" autocomplete="off" maxlength="4" placeholder="RAUMCODE" aria-describedby="hosted-status" />
                <button type="submit" data-text="joinButton">Beitreten</button>
              </div>
              <small data-text="joinHint">Du öffnest den Handy-Controller für diesen Raum.</small>
            </form>
          </div>
          <p id="hosted-status" class="hosted-status" role="status" data-text="ready">Bereit.</p>
        </div>
        <p class="hosted-ldc-footer"><a href="https://www.instagram.com/ldc.club/" target="_blank" rel="noreferrer">@ldc.club on Instagram</a><span>Made by LDC — best member Israa Chiheb</span></p>
      </section>
      <aside class="hosted-art" aria-hidden="true">
        <div class="hosted-orbit orbit-one"></div><div class="hosted-orbit orbit-two"></div>
        <div class="hosted-code-card"><small>RAUMCODE</small><strong>PLAY</strong><span>● ● ●</span></div>
      </aside>
    </main>
  `;

  const style = document.createElement("style");
  style.textContent = `
    :root{${themeRootBlock()};font-family:var(--font-body);color:var(--ink);background:#07100c}
    .hosted-landing-page,.hosted-landing-page #app{overflow:auto;min-height:100%;height:auto;background:#07100c}
    .hosted-landing{box-sizing:border-box;position:relative;min-height:100vh;min-height:100dvh;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(320px,.92fr);align-items:center;gap:clamp(30px,5vw,76px);padding:clamp(28px,5vw,68px);overflow:visible;color:#fbf1d6;background:radial-gradient(ellipse 70% 45% at 78% 70%,rgba(255,160,70,.6),transparent 70%),linear-gradient(180deg,#052b38 0%,#0a5350 24%,#37966f 42%,#e9bb5c 58%,#ff9650 68%,#2a1a10 100%)}
    .hosted-scene{position:fixed;inset:0;overflow:hidden;pointer-events:none}
    .hosted-rays{position:absolute;right:20%;bottom:30%;width:150vmax;height:150vmax;transform-origin:100% 100%;background:repeating-conic-gradient(from 270deg at 100% 100%,rgba(255,214,120,.22) 0 3deg,transparent 3deg 9deg);-webkit-mask:radial-gradient(circle at 100% 100%,#000,transparent 60%);mask:radial-gradient(circle at 100% 100%,#000,transparent 60%);animation:hosted-sway 9s ease-in-out infinite alternate;mix-blend-mode:screen}
    @keyframes hosted-sway{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
    .hosted-sun{position:absolute;right:calc(20% - 17vmin);bottom:calc(30% - 17vmin);width:34vmin;height:34vmin;border-radius:50%;background:radial-gradient(circle,#fff6c8 0%,#ffd36a 30%,#ff9a45 58%,rgba(255,130,60,0) 72%)}
    .hosted-gcard{position:absolute;width:clamp(30px,3.8vw,48px);aspect-ratio:2/3;border-radius:5px;border:1.5px solid #e8bd4f;background:linear-gradient(145deg,#f3e9d2,#cdbf98);opacity:.5;box-shadow:0 0 14px rgba(201,162,74,.4);animation:hosted-cfloat 9s ease-in-out infinite;animation-delay:var(--d)}
    .hosted-gcard::before{content:"";position:absolute;inset:22% 24%;background:linear-gradient(135deg,var(--c,#35d07f),rgba(0,0,0,.45));transform:rotate(45deg);border-radius:3px}
    @keyframes hosted-cfloat{0%,100%{transform:translateY(0) rotateY(-30deg) rotateZ(var(--r))}50%{transform:translateY(-16px) rotateY(30deg) rotateZ(var(--r))}}
    .hosted-ship{position:absolute;top:15%;left:0;width:230px;opacity:.9;animation:hosted-cross 80s linear infinite}
    @keyframes hosted-cross{from{transform:translateX(-260px)}to{transform:translateX(110vw)}}
    .hosted-birds{position:absolute;top:24%;left:0;width:90px;opacity:.75;animation:hosted-cross 55s linear infinite -20s}
    .hosted-birds path{fill:none;stroke:#082a1f;stroke-width:2.2;stroke-linecap:round}
    .hosted-tree{position:absolute;right:5%;bottom:13%;height:68%;opacity:.88;transform-origin:50% 100%}
    .hosted-tower{position:absolute;left:36%;bottom:12%;height:50%;opacity:.7}
    .hosted-layer{position:absolute;left:0;width:100%;display:flex;flex-wrap:nowrap;pointer-events:none;will-change:transform}
    .hosted-layer svg{flex:none;height:100%;display:block}
    .hosted-mist{position:absolute;left:-20%;width:140%;height:30%;background:radial-gradient(ellipse at 50% 50%,rgba(255,210,150,.26),transparent 65%);filter:blur(14px);animation:hosted-drift 22s linear infinite alternate;pointer-events:none}
    @keyframes hosted-drift{to{transform:translateX(14%)}}
    .hosted-ground{position:absolute;left:0;right:0;bottom:0;height:5.5%;background:linear-gradient(#0a1c15,#040a08)}
    .hosted-path{position:absolute;left:0;right:0;bottom:5.5%;height:2.2%;background:linear-gradient(#6b4a2b,#2e1d10);border-top:1px solid rgba(255,214,150,.45)}
    .hosted-dash{position:absolute;left:0;right:0;bottom:6.1%;height:3px;background:repeating-linear-gradient(90deg,rgba(243,233,210,.3) 0 18px,transparent 18px 60px)}
    .hosted-hero-wrap{position:absolute;left:15%;bottom:3.2%;height:40%;aspect-ratio:1/2}
    .hosted-aura{position:absolute;inset:-4% -70% 0 -70%;background:radial-gradient(ellipse at 50% 62%,rgba(140,255,170,.6),rgba(53,208,127,.28) 38%,transparent 64%);filter:blur(8px);opacity:.25;animation:hosted-apulse 3s ease-in-out infinite alternate}
    @keyframes hosted-apulse{to{transform:scale(1.08)}}
    .hosted-flare .hosted-aura{animation:hosted-burst 1.4s ease-out 1}
    @keyframes hosted-burst{0%{transform:scale(1);opacity:.4}40%{transform:scale(2.2);opacity:1}100%{transform:scale(1.1)}}
    .hosted-hero{position:relative;width:100%;height:100%;filter:drop-shadow(0 0 6px rgba(255,190,100,.6));overflow:visible}
    .hosted-hero .p{fill:url(#hosted-cl);stroke:#ffd28a;stroke-opacity:.75;stroke-width:1.3;stroke-linejoin:round}
    .hosted-hero .f{fill:#07110d;stroke:#ffd28a;stroke-opacity:.3;stroke-width:1.1}
    .hosted-hero .gold{fill:#c9a24a;opacity:.85}
    .hosted-hero .sh{fill:rgba(0,0,0,.55)}
    #hosted-fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
    .hosted-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.55))}
    .hosted-nenwheel{position:absolute;left:50%;top:44%;width:min(92vmin,820px);aspect-ratio:1;transform:translate(-50%,-50%);opacity:.22;pointer-events:none;overflow:visible;animation:hosted-spin 140s linear infinite}
    .hosted-backdrop{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.5))}
    .hosted-hero{position:relative;z-index:2;max-width:760px}
    .hosted-topbar{display:flex;align-items:center;justify-content:space-between;gap:20px}
    .hosted-brand{display:flex;align-items:center;gap:12px;font-weight:700;letter-spacing:.02em}
    .hosted-brand img{width:52px;height:52px;border-radius:50%;object-fit:cover;border:1px solid rgba(201,162,74,.8);box-shadow:0 0 18px rgba(47,179,131,.45)}
    .hosted-brand span{display:grid;line-height:1.3}
    .hosted-brand strong{font-size:15px;letter-spacing:.1em;text-transform:uppercase}
    .hosted-brand small{font-size:11px;letter-spacing:.22em;color:#e8bd4f;text-transform:uppercase;font-weight:600}
    .hosted-language{min-height:44px;padding:9px 16px;border:1px solid rgba(201,162,74,.5);border-radius:999px;background:rgba(0,0,0,.4);color:#c9d3bd;font-size:12px;font-weight:700;letter-spacing:.08em;cursor:pointer}
    .hosted-language:hover{border-color:#35d07f;color:#35d07f}
    .hosted-card{margin-top:clamp(24px,4vh,44px);padding:clamp(20px,3.4vw,34px);border-radius:18px;border:1px solid rgba(232,189,79,.6);background:linear-gradient(135deg,rgba(251,241,214,.1),rgba(251,241,214,.03) 45%,rgba(8,40,30,.9));box-shadow:0 24px 70px rgba(0,0,0,.55)}
    .hosted-kicker{margin:0 0 12px;color:#e8bd4f;font-size:12px;font-weight:700;letter-spacing:.22em}
    .hosted-hero h1{margin:0;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-style:italic;font-weight:800;font-size:clamp(42px,5.2vw,72px);line-height:.96;letter-spacing:.02em}
    .hosted-hero h1 em{color:#35d07f;font-style:italic}
    .hosted-intro{max-width:670px;margin:18px 0 24px;color:#c9d3bd;font-size:clamp(15px,1.35vw,18px);line-height:1.55}
    .hosted-actions{display:flex;align-items:stretch;gap:18px;flex-wrap:wrap}
    .hosted-create,.hosted-join{box-sizing:border-box;border-radius:14px}
    .hosted-create{min-width:250px;min-height:52px;padding:20px 24px;border:1px solid #c9a24a;background:linear-gradient(135deg,#e6c46b,#c9a24a);color:#1a1405;text-align:left;cursor:pointer;box-shadow:0 6px 18px rgba(201,162,74,.3);transition:transform .15s,filter .15s}
    .hosted-create:hover{transform:translateY(-2px);filter:brightness(1.06)}
    .hosted-create span,.hosted-join label{display:block;font-size:16px;font-weight:700}
    .hosted-create small,.hosted-join small{display:block;margin-top:5px;opacity:.75}
    .hosted-create small{color:#1a1405}
    .hosted-join small{color:#c9d3bd}
    .hosted-or{align-self:center;color:#c9d3bd;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
    .hosted-join{min-width:310px;padding:17px 18px;border:1px solid rgba(243,233,210,.35);background:rgba(0,0,0,.4);box-shadow:0 18px 50px rgba(0,0,0,.5)}
    .hosted-join label{margin-bottom:10px;color:#fbf1d6}
    .hosted-join div{display:flex;gap:8px}
    .hosted-join input{min-width:0;flex:1;min-height:52px;padding:12px 13px;border:2px solid rgba(201,162,74,.5);border-radius:10px;background:rgba(0,0,0,.5);color:#fbf1d6;font-family:var(--font-mono);font-weight:700;font-size:1.3rem;letter-spacing:.16em;text-transform:uppercase;outline:none}
    .hosted-join input:focus{border-color:#35d07f;box-shadow:0 0 0 3px rgba(47,179,131,.25)}
    .hosted-join button{min-height:52px;padding:0 18px;border:0;border-radius:10px;background:linear-gradient(135deg,#e6c46b,#c9a24a);color:#1a1405;font-weight:700;cursor:pointer}
    .hosted-join button:hover{filter:brightness(1.08)}
    .hosted-status{min-height:20px;margin:18px 0 0;color:#c9d3bd;font-size:13px}
    .hosted-status[data-error="true"]{color:#ff9c8a}
    .hosted-ldc-footer{margin:22px 0 0;display:grid;gap:4px;font-size:13px;color:#c9d3bd}
    .hosted-ldc-footer a{color:#35d07f;font-weight:700;text-decoration:none}
    .hosted-ldc-footer a:hover{text-decoration:underline}
    .hosted-art{position:relative;z-index:1;min-height:540px;display:grid;place-items:center}
    .hosted-orbit{position:absolute;border:1px solid rgba(201,162,74,.4);border-radius:50%;animation:hosted-spin 22s linear infinite}
    .orbit-one{width:520px;height:520px}
    .orbit-two{width:350px;height:350px;border-color:#35d07f;animation-direction:reverse;animation-duration:16s}
    .hosted-orbit:after{content:"";position:absolute;top:8%;left:14%;width:14px;height:14px;border-radius:50%;background:#35d07f}
    .orbit-two:after{top:auto;left:auto;right:5%;bottom:22%;background:#e8bd4f}
    .hosted-code-card{position:relative;width:min(72%,360px);aspect-ratio:1.15;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px solid #e8bd4f;border-radius:18px;background:linear-gradient(160deg,#fbf1d6,#e6d6ac);color:#16261e;box-shadow:0 24px 70px rgba(0,0,0,.55);transform:rotate(-3deg)}
    .hosted-code-card small{color:#7a5f1c;font-weight:700;letter-spacing:.18em}
    .hosted-code-card strong{margin:13px 0;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-style:italic;font-weight:800;font-size:clamp(58px,7vw,94px);letter-spacing:.08em}
    .hosted-code-card span{color:#1f8a62;letter-spacing:.6em}
    @keyframes hosted-spin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){.hosted-orbit,.hosted-rays,.hosted-gcard,.hosted-ship,.hosted-birds,.hosted-mist,.hosted-aura,.hosted-nenwheel{animation:none}.hosted-ship,.hosted-birds{display:none}}
    @media(max-width:900px){.hosted-landing{grid-template-columns:1fr;padding:28px 20px 48px}.hosted-art{display:none}.hosted-actions{flex-direction:column}.hosted-or{display:none}.hosted-create,.hosted-join{width:100%;min-width:0}.hosted-hero h1{font-size:clamp(40px,13vw,68px)}.hosted-hero-wrap{left:5%;height:30%}.hosted-tree{height:48%;right:-12%}}
    @media(max-height:560px){.hosted-hero-wrap,.hosted-tree,.hosted-tower{display:none}}
  `;
  document.head.appendChild(style);

  const createButton = app.querySelector<HTMLButtonElement>(".hosted-create");
  const joinForm = app.querySelector<HTMLFormElement>(".hosted-join");
  const roomInput = app.querySelector<HTMLInputElement>("#hosted-room-code");
  const status = app.querySelector<HTMLParagraphElement>("#hosted-status");
  const languageButton = app.querySelector<HTMLButtonElement>(".hosted-language");
  let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  const renderLanguage = () => {
    const text = landingText[language];
    document.documentElement.lang = language;
    document.title = text.title;

    for (const element of app.querySelectorAll<HTMLElement>("[data-text]")) {
      const key = element.dataset.text as keyof typeof text;
      element.textContent = text[key];
    }

    if (roomInput) roomInput.placeholder = text.roomCode;
    if (languageButton) languageButton.ariaLabel = text.switchLanguage;

    if (closedReason === "inactive") setStatus(text.closedInactive);
    if (closedReason === "expired") setStatus(text.closedExpired);
    if (closedReason === "capacity") setStatus(text.closedCapacity);
  };

  const setStatus = (message: string, error = false) => {
    if (!status) return;
    status.textContent = message;
    status.dataset.error = String(error);
  };

  const triggerFlare = (): void => {
    const wrap = app.querySelector("#hosted-hero-wrap");

    if (!(wrap instanceof HTMLElement)) {
      return;
    }

    wrap.classList.remove("hosted-flare");
    void wrap.offsetWidth;
    wrap.classList.add("hosted-flare");
  };

  roomInput?.addEventListener("input", () => {
    roomInput.value = normalizeRoomCode(roomInput.value);
  });

  languageButton?.addEventListener("click", () => {
    // English only — no language switch
    languageButton.ariaLabel = landingText.en.switchLanguage;
  });

  createButton?.addEventListener("click", () => {
    createButton.disabled = true;
    setStatus(landingText[language].creating);
    triggerFlare();
    socket = io(window.location.origin, { timeout: 8_000 });
    socket.on("connect_error", () => {
      createButton.disabled = false;
      setStatus(landingText[language].unavailable, true);
      socket?.disconnect();
    });
    socket.emit("room:create", { hostName: "Hosted Screen", language }, (result) => {
      if (!result.ok) {
        createButton.disabled = false;
        setStatus(result.error, true);
        socket?.disconnect();
        return;
      }

      window.location.assign(`/host?room=${encodeURIComponent(result.data.room.code)}`);
    });
  });

  joinForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const roomCode = normalizeRoomCode(roomInput?.value ?? "");

    if (roomCode.length !== 4) {
      setStatus(landingText[language].invalidCode, true);
      roomInput?.focus();
      return;
    }

    window.location.assign(`/controller/#join?room=${encodeURIComponent(roomCode)}`);
  });

  startLandingScene(app);

  renderLanguage();
}

/**
 * Ambient Hunter × Hunter scene engine for the landing page.
 *
 * Adapted from the supplied reference design: seeded pine-forest parallax
 * layers, a walking hunter (hip/knee/ankle walk cycle with counter-swinging
 * arms), drifting Nen-mote canvas and a scrolling path. Ambient mode walks
 * at a steady pace — there is no loading progress on this page.
 *
 * The loop pauses when the tab is hidden and all motion is disabled under
 * prefers-reduced-motion, so projectors and phones stay calm when asked.
 */
function startLandingScene(app: HTMLElement): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const seeded = (seed: number): (() => number) => {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  };

  const pineTrees = (seed: number, count: number, minH: number, maxH: number, fill: string, opacity: number): string => {
    const rand = seeded(seed);
    const H = 420;
    const W = 1200;
    let d = "";

    for (let i = 0; i < count; i++) {
      const x = 50 + (i * (W - 100)) / count + rand() * 26;
      const h = minH + rand() * (maxH - minH);
      const w = h * 0.3;

      for (let k = 0; k < 4; k++) {
        const ty = H - h + k * h * 0.2;
        const hw = w * (0.34 + k * 0.2);
        d += `M${x} ${ty}L${x + hw} ${ty + h * 0.34}L${x - hw} ${ty + h * 0.34}Z`;
      }

      d += `M${x - 4} ${H}V${H - h * 0.2}H${x + 4}V${H}Z`;
    }

    return `<svg viewBox="0 0 1200 420" preserveAspectRatio="xMinYMax meet"><path d="${d}" fill="${fill}" opacity="${opacity}"/><rect y="408" width="1200" height="12" fill="${fill}" opacity="${opacity}"/></svg>`;
  };

  const grass = (seed: number): string => {
    const rand = seeded(seed);
    let d = "";

    for (let i = 0; i < 150; i++) {
      const x = rand() * 1200;
      const h = 26 + rand() * 64;
      const lean = (rand() - 0.5) * 22;
      d += `M${x} 100L${x + lean} ${100 - h}L${x + 5} 100Z`;
    }

    return `<svg viewBox="0 0 1200 100" preserveAspectRatio="xMinYMax meet"><path d="${d}" fill="#030c08"/></svg>`;
  };

  interface SceneLayer {
    element: HTMLElement;
    speed: number;
    tileWidth: number;
  }

  const layerDefs = [
    { id: "hosted-L0", bottom: "11%", height: "52%", speed: 0.1, art: pineTrees(7, 24, 90, 170, "#2f7d60", 0.6), aspect: 1200 / 420 },
    { id: "hosted-L1", bottom: "9%", height: "46%", speed: 0.28, art: pineTrees(19, 16, 140, 260, "#17533f", 0.88), aspect: 1200 / 420 },
    { id: "hosted-L2", bottom: "7%", height: "40%", speed: 0.62, art: pineTrees(31, 9, 230, 400, "#082a1f", 1), aspect: 1200 / 420 },
    { id: "hosted-L3", bottom: "0", height: "11%", speed: 1.3, art: grass(5), aspect: 12 }
  ];

  const layers: SceneLayer[] = [];

  for (const def of layerDefs) {
    const element = app.querySelector<HTMLElement>(`#${def.id}`);

    if (!element) {
      continue;
    }

    element.style.bottom = def.bottom;
    element.style.height = def.height;
    const height = element.getBoundingClientRect().height || window.innerHeight * 0.4;
    const tileWidth = height * def.aspect;
    const copies = Math.ceil(window.innerWidth / tileWidth) + 2;
    element.innerHTML = def.art.repeat(copies);

    for (const svg of element.querySelectorAll("svg")) {
      (svg as SVGSVGElement).style.width = `${tileWidth}px`;
    }

    layers.push({ element, speed: def.speed, tileWidth });
  }

  const heroWrap = app.querySelector("#hosted-hero-wrap");
  const heroHeight = heroWrap?.getBoundingClientRect().height || 300;
  const dash = app.querySelector<HTMLElement>("#hosted-dash");
  const canvas = app.querySelector<HTMLCanvasElement>("#hosted-fx");
  const context = canvas?.getContext("2d") ?? null;

  const joints = new Map<string, SVGGElement>();

  for (const name of ["Ln", "Kn", "An", "Lf", "Kf", "Af", "Bd", "Un", "Fn", "Uf", "Ff", "Hd", "Hr", "Sc"]) {
    const node = app.querySelector<SVGGElement>(`#hosted-h${name}`);

    if (node) {
      joints.set(name, node);
    }
  }

  const setTransform = (node: SVGGElement | undefined, value: string): void => {
    node?.setAttribute("transform", value);
  };

  const solveLeg = (phase: number): { foot: number; knee: number; ankle: number; extension: number } => {
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    const foot = 28 * s;
    const knee = 6 + 52 * Math.pow(Math.max(0, c), 1.3);
    const swing =
      22 * Math.pow(Math.max(0, -s), 2) - 10 * Math.pow(Math.max(0, s), 4) - 8 * Math.max(0, c);
    const radians = Math.PI / 180;
    const extension =
      82 * Math.cos(foot * radians) + 80 * Math.cos((knee - foot) * radians) + 20 * Math.cos(swing * radians);

    return { foot, knee, ankle: swing + foot - knee, extension };
  };

  const pose = (phase: number, time: number, energy: number): void => {
    if (joints.size === 0) {
      return;
    }

    const near = solveLeg(phase);
    const far = solveLeg(phase + Math.PI);
    const hipY = 392 - Math.max(near.extension, far.extension);

    setTransform(joints.get("Ln"), `translate(100,${hipY}) rotate(${-near.foot})`);
    setTransform(joints.get("Kn"), "translate(0,82) rotate(" + near.knee + ")");
    setTransform(joints.get("An"), "translate(0,80) rotate(" + near.ankle + ")");
    setTransform(joints.get("Lf"), `translate(100,${hipY}) rotate(${-far.foot})`);
    setTransform(joints.get("Kf"), "translate(0,82) rotate(" + far.knee + ")");
    setTransform(joints.get("Af"), "translate(0,80) rotate(" + far.ankle + ")");

    const lean = 5 + 1.2 * Math.sin(phase * 2);
    setTransform(joints.get("Bd"), `translate(100,${hipY}) rotate(${lean})`);

    const nearArm = 24 * Math.sin(phase + Math.PI);
    const farArm = 24 * Math.sin(phase);
    setTransform(joints.get("Un"), `translate(2,-96) rotate(${-nearArm})`);
    setTransform(joints.get("Fn"), `translate(0,58) rotate(${-(14 + 24 * Math.max(0, Math.sin(phase + Math.PI)))})`);
    setTransform(joints.get("Uf"), `translate(-2,-96) rotate(${-farArm})`);
    setTransform(joints.get("Ff"), `translate(0,58) rotate(${-(14 + 24 * Math.max(0, Math.sin(phase)))})`);
    setTransform(joints.get("Hd"), `translate(4,-112) rotate(${-lean * 0.7 + Math.sin(phase * 2) * 0.8})`);
    setTransform(joints.get("Hr"), `rotate(${-6 + Math.sin(time * 5) * 2.5 - energy * 3})`);

    const top: string[] = [];
    const bottom: string[] = [];

    for (let i = 0; i < 6; i++) {
      const x = -2 - i * 17 * (0.8 + 0.2 * energy);
      const y = -108 + i * 2 + Math.sin(time * 10 - i) * (1.5 + i * 2.2) * (0.6 + 0.4 * energy);
      const w = (8.5 - i * 1.3) / 2;
      top.push(`${x},${y - w}`);
      bottom.unshift(`${x},${y + w}`);
    }

    joints.get("Sc")?.setAttribute("points", top.concat(bottom).join(" "));
  };

  interface Mote {
    x: number;
    y: number;
    size: number;
    velocity: number;
    phase: number;
    gold: boolean;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const moteCount = window.innerWidth < 700 ? 36 : 80;
  const motes: Mote[] = [];

  for (let i = 0; i < moteCount; i++) {
    motes.push({
      x: Math.random(),
      y: Math.random(),
      size: 0.6 + Math.random() * 1.8,
      velocity: 0.01 + Math.random() * 0.03,
      phase: Math.random() * 6,
      gold: Math.random() < 0.35
    });
  }

  const resizeCanvas = (): void => {
    if (!canvas) {
      return;
    }

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  };

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  let phase = 0.6;
  let distance = 0;
  let last = 0;
  let stopped = false;

  document.addEventListener("visibilitychange", () => {
    stopped = document.hidden;
    last = 0;
  });

  pose(phase, 0, 1);

  if (reduceMotion) {
    // Static first frame only — no animation loop at all.
    return;
  }

  const frame = (timestamp: number): void => {
    requestAnimationFrame(frame);

    if (stopped) {
      return;
    }

    const dt = Math.min((timestamp - last) / 1000 || 0, 0.05);
    last = timestamp;

    phase += dt * 6.283 * 1.05;
    distance += dt * 323 * (heroHeight / 400);
    pose(phase, timestamp / 1000, 1);

    for (const layer of layers) {
      layer.element.style.transform = `translate3d(${-(distance * layer.speed) % layer.tileWidth}px,0,0)`;
    }

    if (dash) {
      dash.style.backgroundPosition = `${-distance % 60}px 0`;
    }

    if (context && canvas) {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.globalCompositeOperation = "lighter";

      for (const mote of motes) {
        const x = (mote.x + Math.sin(timestamp * 0.0004 + mote.phase) * 0.02) * window.innerWidth;
        const y = mote.y * window.innerHeight;
        const alpha = 0.35 + 0.4 * Math.sin(timestamp * 0.002 + mote.phase);
        const color = mote.gold ? "255,225,140" : "90,240,180";
        context.fillStyle = `rgba(${color},${alpha})`;
        context.beginPath();
        context.arc(x, y, mote.size * 2.2, 0, 6.283);
        context.fill();
        context.fillStyle = `rgba(${color},${alpha * 0.2})`;
        context.beginPath();
        context.arc(x, y, mote.size * 7, 0, 6.283);
        context.fill();
        mote.y -= mote.velocity * 0.016;

        if (mote.y < -0.05) {
          mote.y = 1.05;
          mote.x = Math.random();
        }
      }
    }
  };

  requestAnimationFrame(frame);
}
