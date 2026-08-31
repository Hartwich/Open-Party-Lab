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
  de: {
    title: "Open Party Lab – Raum starten",
    kicker: "DEIN BILDSCHIRM. EURE HANDYS. EIN RAUM.",
    heading: "Die Party beginnt",
    headingAccent: "mit deinem Raum.",
    intro: "Erstelle einen neuen Spielraum auf diesem Bildschirm oder tritt mit deinem Handy einem bestehenden Raum bei.",
    create: "Neuen Raum erstellen",
    createHint: "Dieser Bildschirm wird zum Host",
    or: "oder",
    join: "Bestehendem Raum beitreten",
    roomCode: "RAUMCODE",
    joinButton: "Beitreten",
    joinHint: "Du öffnest den Handy-Controller für diesen Raum.",
    ready: "Bereit.",
    creating: "Raum wird erstellt …",
    unavailable: "Der Server ist gerade nicht erreichbar. Bitte versuche es erneut.",
    invalidCode: "Bitte gib den vierstelligen Raumcode ein.",
    closedInactive: "Der vorherige Raum wurde nach zehn Minuten ohne Aktivität geschlossen.",
    closedExpired: "Der vorherige Raum wurde nach einer Stunde automatisch geschlossen.",
    closedCapacity: "Der vorherige Raum hatte keine aktiven Spieler und wurde geschlossen, um Platz für einen neuen Raum zu schaffen.",
    switchLanguage: "Switch to English"
  },
  en: {
    title: "Open Party Lab – Start a room",
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
    switchLanguage: "Auf Deutsch wechseln"
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
      <section class="hosted-hero" aria-labelledby="landing-title">
        <div class="hosted-topbar"><div class="hosted-brand"><span aria-hidden="true">OPL</span> Open Party Lab</div><button class="hosted-language" type="button">DE / EN</button></div>
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
      </section>
      <aside class="hosted-art" aria-hidden="true">
        <div class="hosted-orbit orbit-one"></div><div class="hosted-orbit orbit-two"></div>
        <div class="hosted-code-card"><small>RAUMCODE</small><strong>PLAY</strong><span>● ● ●</span></div>
      </aside>
    </main>
  `;

  const style = document.createElement("style");
  style.textContent = `
    :root{${themeRootBlock()};font-family:var(--font-body);color:var(--ink);background:var(--paper)}
    .hosted-landing-page,.hosted-landing-page #app{overflow:auto;min-height:100%;height:auto;background:var(--paper)}
    .hosted-landing{box-sizing:border-box;position:relative;min-height:100vh;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(320px,.92fr);align-items:center;gap:clamp(30px,5vw,76px);padding:clamp(28px,5vw,68px);overflow:hidden;background:radial-gradient(circle at 82% 18%,var(--accent-soft),transparent 42%),radial-gradient(circle at 10% 90%,var(--sage-soft),transparent 38%),var(--paper)}
    .hosted-landing:before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:72px 72px;opacity:.5;mask-image:linear-gradient(to right,#000,transparent 85%)}
    .hosted-hero{position:relative;z-index:2;max-width:760px}
    .hosted-topbar{display:flex;align-items:center;justify-content:space-between;gap:20px}
    .hosted-brand{display:flex;align-items:center;gap:12px;font-weight:700;letter-spacing:.02em}
    .hosted-brand span{display:grid;place-items:center;width:42px;height:42px;border:1px solid var(--accent);border-radius:var(--radius-md);color:var(--accent);font-size:12px;letter-spacing:.08em}
    .hosted-language{padding:9px 14px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--muted);font-size:12px;font-weight:700;letter-spacing:.08em;cursor:pointer}
    .hosted-language:hover{border-color:var(--accent);color:var(--accent)}
    .hosted-kicker{margin:clamp(30px,5vh,56px) 0 16px;color:var(--accent);font-size:12px;font-weight:800;letter-spacing:.22em}
    .hosted-hero h1{margin:0;font-family:var(--font-display);font-weight:500;font-size:clamp(45px,5.2vw,76px);line-height:.96;letter-spacing:-.03em}
    .hosted-hero h1 em{color:var(--accent);font-style:normal}
    .hosted-intro{max-width:670px;margin:22px 0 28px;color:var(--muted);font-size:clamp(16px,1.35vw,19px);line-height:1.55}
    .hosted-actions{display:flex;align-items:stretch;gap:18px}
    .hosted-create,.hosted-join{box-sizing:border-box;border-radius:var(--radius-lg)}
    .hosted-create{min-width:250px;padding:20px 24px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);text-align:left;cursor:pointer;box-shadow:var(--shadow-card);transition:transform .2s,box-shadow .2s,background .2s}
    .hosted-create:hover{transform:translateY(-2px);background:var(--accent-strong);box-shadow:var(--shadow-panel)}
    .hosted-create span,.hosted-join label{display:block;font-size:16px;font-weight:700}
    .hosted-create small,.hosted-join small{display:block;margin-top:5px;opacity:.78}
    .hosted-or{align-self:center;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.08em}
    .hosted-join{min-width:310px;padding:17px 18px;border:1px solid var(--line);background:var(--surface);box-shadow:var(--shadow-card)}
    .hosted-join label{margin-bottom:10px}
    .hosted-join div{display:flex;gap:8px}
    .hosted-join input{min-width:0;flex:1;padding:12px 13px;border:1px solid var(--line);border-radius:var(--radius-md);background:var(--paper);color:var(--ink);font-family:var(--font-mono);font-weight:700;letter-spacing:.16em;text-transform:uppercase;outline:none}
    .hosted-join input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
    .hosted-join button{padding:0 18px;border:1px solid var(--sage);border-radius:var(--radius-md);background:var(--sage);color:var(--on-accent);font-weight:700;cursor:pointer}
    .hosted-join button:hover{background:var(--sage-strong);border-color:var(--sage-strong)}
    .hosted-status{min-height:20px;margin:18px 0 0;color:var(--muted);font-size:13px}
    .hosted-status[data-error="true"]{color:var(--danger)}
    .hosted-art{position:relative;z-index:1;min-height:540px;display:grid;place-items:center}
    .hosted-orbit{position:absolute;border:1px solid var(--line-strong);border-radius:50%;animation:hosted-spin 22s linear infinite}
    .orbit-one{width:520px;height:520px}
    .orbit-two{width:350px;height:350px;border-color:var(--sage);animation-direction:reverse;animation-duration:16s}
    .hosted-orbit:after{content:"";position:absolute;top:8%;left:14%;width:14px;height:14px;border-radius:50%;background:var(--accent)}
    .orbit-two:after{top:auto;left:auto;right:5%;bottom:22%;background:var(--sage)}
    .hosted-code-card{position:relative;width:min(72%,360px);aspect-ratio:1.15;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:36px;background:var(--surface);box-shadow:var(--shadow-modal);transform:rotate(-3deg)}
    .hosted-code-card small{color:var(--muted);font-weight:700;letter-spacing:.18em}
    .hosted-code-card strong{margin:13px 0;font-family:var(--font-display);font-weight:500;font-size:clamp(58px,7vw,94px);letter-spacing:.08em}
    .hosted-code-card span{color:var(--accent);letter-spacing:.6em}
    @keyframes hosted-spin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){.hosted-orbit{animation:none}}
    @media(max-width:900px){.hosted-landing{grid-template-columns:1fr;padding:28px 20px 48px}.hosted-art{display:none}.hosted-kicker{margin-top:48px}.hosted-actions{flex-direction:column}.hosted-or{display:none}.hosted-create,.hosted-join{width:100%;min-width:0}.hosted-hero h1{font-size:clamp(44px,14vw,74px)}}
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

  roomInput?.addEventListener("input", () => {
    roomInput.value = normalizeRoomCode(roomInput.value);
  });

  languageButton?.addEventListener("click", () => {
    language = language === "de" ? "en" : "de";
    writeStoredHostLanguage(language);
    renderLanguage();
  });

  createButton?.addEventListener("click", () => {
    createButton.disabled = true;
    setStatus(landingText[language].creating);
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

  renderLanguage();
}
