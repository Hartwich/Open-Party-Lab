import { useState } from "react";
import type { SupportedLanguage } from "@open-party-lab/protocol";
import { LDC_CLUB } from "@open-party-lab/game-core";
import { getControllerText } from "../i18n/controllerText.js";
import { HunterScene } from "./HunterScene.js";
import { HUNTER_AVATARS } from "../controller-ui/common/HunterAvatars.js";

interface JoinPageProps {
  defaultRoomCode: string;
  connected: boolean;
  error: string | null;
  language: SupportedLanguage;
  onJoin: (roomCode: string, playerName: string, avatarId: string, preferredColor: string) => void;
}

const AVATAR_STORAGE_KEY = "ldc.selectedAvatarId";

function readStoredAvatarId(): string {
  try {
    const stored = window.localStorage.getItem(AVATAR_STORAGE_KEY);
    if (stored && HUNTER_AVATARS.some((avatar) => avatar.id === stored)) {
      return stored;
    }
  } catch {
    // localStorage can be blocked in private mode; fall through to default.
  }
  return HUNTER_AVATARS[0].id;
}

function resolveHostUrl(): string {
  // Portable/hosted builds serve host + controller from one origin (/host).
  // In dev the host runs on :5173 next to the controller on :5174.
  if (window.location.port === "5174") {
    return `${window.location.protocol}//${window.location.hostname}:5173`;
  }

  return "/host";
}

/**
 * Welcome Day entry screen: the Hunter entry card.
 *
 * Same join contract as before (room code + player name → onJoin); only the
 * presentation is new. Room code is normalized to uppercase alphanumerics,
 * validation errors shake the card, and the join button stays disabled until
 * the socket is connected.
 */
export function JoinPage({ defaultRoomCode, connected, error, language, onJoin }: JoinPageProps) {
  const [roomCode, setRoomCode] = useState(defaultRoomCode);
  const [playerName, setPlayerName] = useState("");
  const [avatarId, setAvatarId] = useState(readStoredAvatarId);
  const [localError, setLocalError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const text = getControllerText(language);
  const shownError = localError ?? error;
  const selectedAvatar = HUNTER_AVATARS.find((avatar) => avatar.id === avatarId) ?? HUNTER_AVATARS[0];

  const selectAvatar = (nextId: string): void => {
    setAvatarId(nextId);
    setLocalError(null);
    try {
      window.localStorage.setItem(AVATAR_STORAGE_KEY, nextId);
    } catch {
      // Non-fatal: selection still applies for this join attempt.
    }
  };

  const flagError = (message: string): void => {
    setLocalError(message);
    // Re-trigger the shake animation without remounting (remounting would
    // drop input focus and clear the keyboard on phones).
    setShaking(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShaking(true));
    });
  };

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    const code = roomCode.trim().toUpperCase();
    const name = playerName.trim();

    if (code.length !== 4) {
      flagError(language === "en" ? "Enter the 4-character room code." : "Bitte gib den vierstelligen Raumcode ein.");
      return;
    }

    if (!name) {
      flagError(language === "en" ? "Enter your hunter name." : "Bitte gib deinen Spielernamen ein.");
      return;
    }

    setLocalError(null);
    onJoin(code, name, selectedAvatar.id, selectedAvatar.color);
  };

  return (
    <div className="hxh-scope hxh-entry">
      <HunterScene />
      <div className="hxh-content" style={{ width: "100%", maxWidth: 560, display: "grid", gap: 16 }}>
        <div
          className={`hxh-card${shaking ? " hxh-shake" : ""}`}
          onAnimationEnd={() => setShaking(false)}
        >
          <i className="hxh-corner hxh-c1" aria-hidden="true" />
          <i className="hxh-corner hxh-c2" aria-hidden="true" />
          <i className="hxh-corner hxh-c3" aria-hidden="true" />
          <i className="hxh-corner hxh-c4" aria-hidden="true" />
          <div className="hxh-strip">
            <span>Entry Pass</span>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14 }}>
            <span className="hxh-logo-frame" aria-hidden="true">
              <img src={`${import.meta.env.BASE_URL}ldc-logo.jpg`} alt="" />
            </span>
            <div style={{ minWidth: 0 }}>
              <p className="hxh-club">LDC — ESTIN</p>
              <h1 className="hxh-title" style={{ fontSize: "clamp(1.7rem, 7.5vw, 2.4rem)" }}>
                Hunter <span className="hxh-x">×</span> Hunter
              </h1>
              <p className="hxh-subtitle">LDC Welcome Day</p>
            </div>
          </div>
          <div className="hxh-nen" aria-hidden="true">
            <i style={{ ["--k" as string]: "#35d07f" }} />
            <i style={{ ["--k" as string]: "#38bdf8" }} />
            <i style={{ ["--k" as string]: "#ff5a5f" }} />
            <i style={{ ["--k" as string]: "#ff9650" }} />
            <i style={{ ["--k" as string]: "#a78bfa" }} />
            <i style={{ ["--k" as string]: "#f472b6" }} />
          </div>

          <form onSubmit={submit} style={{ display: "grid", gap: 14, marginTop: 18 }}>
            <h2 style={{ margin: 0, fontSize: "1.05rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {language === "en" ? "Enter a code" : "Code eingeben"}
            </h2>
            <p className="hxh-tagline" style={{ margin: 0 }}>
              {language === "en" ? "Join the adventure with your room code." : "Betritt das Abenteuer mit deinem Raumcode."}
            </p>
            <label className="hxh-field">
              <span className="hxh-label">{text.roomCode}</span>
              <input
                className="hxh-input hxh-input-code"
                value={roomCode}
                maxLength={4}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="PLAY"
                aria-label={text.roomCode}
                onChange={(event) => {
                  setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                  setLocalError(null);
                }}
              />
            </label>
            <label className="hxh-field">
              <span className="hxh-label">{text.name}</span>
              <input
                className="hxh-input"
                value={playerName}
                maxLength={24}
                autoComplete="off"
                placeholder={language === "en" ? "Hunter name" : "Spielername"}
                aria-label={text.name}
                onChange={(event) => {
                  setPlayerName(event.target.value);
                  setLocalError(null);
                }}
              />
            </label>

            <div className="hxh-field">
              <span className="hxh-label">
                {language === "en" ? "Choose your hunter" : "Wähle deinen Hunter"}
              </span>
              <div className="hxh-avatar-grid" role="radiogroup" aria-label={language === "en" ? "Choose your hunter" : "Wähle deinen Hunter"}>
                {HUNTER_AVATARS.map((avatar) => {
                  const isSelected = avatar.id === selectedAvatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      title={`${avatar.name} — ${avatar.title}`}
                      onClick={() => selectAvatar(avatar.id)}
                      className="hxh-avatar-chip"
                      style={isSelected ? { borderColor: avatar.color, boxShadow: `0 0 0 2px ${avatar.color}55` } : undefined}
                    >
                      {avatar.renderSvg(52)}
                    </button>
                  );
                })}
              </div>
              <p className="hxh-avatar-meta" aria-live="polite">
                <strong style={{ color: selectedAvatar.color }}>{selectedAvatar.name}</strong>
                <span> · {selectedAvatar.title}</span>
              </p>
            </div>

            <p className="hxh-error" role="alert">{shownError ?? ""}</p>
            <button type="submit" className="hxh-btn" disabled={!connected}>
              {connected ? text.joinRoom : text.connectingController}
            </button>
          </form>

          <p className={`hxh-status${connected ? " is-ok" : ""}`} style={{ marginTop: 12 }}>
            {connected ? text.serverConnected : text.serverNotConnected}
          </p>
        </div>

        <p className="hxh-admin-link">
          {language === "en" ? "Running the event? " : "Leitest du das Event? "}
          <a href={resolveHostUrl()}>{language === "en" ? "Open the host screen" : "Host-Bildschirm öffnen"}</a>
          {" · "}
          <a href={LDC_CLUB.instagramUrl} target="_blank" rel="noreferrer">{LDC_CLUB.instagramLabel}</a>
        </p>
        <p className="hxh-status">{LDC_CLUB.footerCredit}</p>
      </div>
    </div>
  );
}
