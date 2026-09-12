import { useEffect, useState } from "react";
import {
  isRoomPaused,
  languageLabels,
  supportedLanguages,
  type RoomSnapshot,
  type SupportedLanguage
} from "@open-party-lab/protocol";
import { themeNames, type ThemeName } from "@open-party-lab/ui-kit";
import { getControllerText } from "../../i18n/controllerText.js";

export interface HostGameMenuProps {
  room: RoomSnapshot;
  onSetPaused: (paused: boolean) => void;
  onSetTheme: (theme: ThemeName) => void;
  onSetLanguage: (language: SupportedLanguage) => void;
  onBackToMenu: () => void;
  onReleaseControl: () => void;
}

/**
 * The host's menu, on the phone that is driving the room.
 *
 * Taking the controls over used to end the moment a round started: the phone
 * became an ordinary controller, and everything host-side — the room settings,
 * the way back to the catalog — lived only on the shared screen, which is the
 * screen the person holding the phone had walked away from.
 *
 * Opening this holds the round instead of talking over it. Nothing in here is
 * worth making everyone else lose the game they are playing, and the pause is
 * what turns "let me check the settings" from a decision into a non-event.
 */
const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 60,
  display: "grid",
  alignItems: "end",
  background: "color-mix(in srgb, var(--ink) 52%, transparent)"
} as const;

const sheetStyle = {
  display: "grid",
  gap: 14,
  maxHeight: "86vh",
  overflowY: "auto",
  padding: "18px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
  borderRadius: "20px 20px 0 0",
  background: "var(--surface)",
  boxShadow: "var(--shadow-panel)"
} as const;

const actionStyle = {
  minHeight: 52,
  padding: "0 16px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent)",
  background: "var(--accent)",
  color: "var(--on-accent)",
  fontWeight: 700,
  width: "100%"
} as const;

const secondaryActionStyle = {
  ...actionStyle,
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--ink)"
} as const;

const labelStyle = {
  margin: 0,
  fontSize: ".72rem",
  letterSpacing: "1.4px",
  textTransform: "uppercase",
  color: "var(--muted)"
} as const;

function chipStyle(selected: boolean) {
  return {
    minHeight: 44,
    padding: "0 14px",
    borderRadius: "var(--radius-md)",
    border: selected ? "2px solid var(--accent)" : "1px solid var(--line)",
    background: selected ? "var(--accent-soft)" : "var(--surface-muted)",
    color: "var(--ink)",
    fontWeight: selected ? 700 : 400
  } as const;
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M5 7h14M5 12h14M5 17h14" />
    </svg>
  );
}

export function HostGameMenu({
  room,
  onSetPaused,
  onSetTheme,
  onSetLanguage,
  onBackToMenu,
  onReleaseControl
}: HostGameMenuProps) {
  const text = getControllerText(room.language);
  const [open, setOpen] = useState(false);

  /**
   * The pause belongs to the menu being open, so the cleanup releases it too —
   * a phone that navigates away, loses control or closes the app must not leave
   * the round frozen for everybody else.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    onSetPaused(true);

    return () => {
      onSetPaused(false);
    };
  }, [open, onSetPaused]);

  // A round that ends while the menu is open makes it stale; close it rather
  // than hold a pause against a round that no longer exists.
  useEffect(() => {
    if (open && !room.currentRound) {
      setOpen(false);
    }
  }, [open, room.currentRound]);

  if (!open) {
    return (
      <button
        type="button"
        aria-label={text.hostMenuOpen}
        title={text.hostMenuOpen}
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: "calc(12px + env(safe-area-inset-right, 0px))",
          bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          zIndex: 55,
          width: 52,
          height: 52,
          display: "grid",
          placeItems: "center",
          borderRadius: 999,
          border: "1px solid var(--line)",
          background: "var(--surface)",
          color: "var(--ink)",
          boxShadow: "var(--shadow-card)"
        }}
      >
        <MenuIcon />
      </button>
    );
  }

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={text.hostMenuTitle}>
      <div style={sheetStyle}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 500 }}>
            {text.hostMenuTitle}
          </strong>
          <span style={{ color: "var(--muted)", fontSize: ".85rem", lineHeight: 1.45 }}>
            {isRoomPaused(room) ? text.hostMenuPausedNote : text.hostControlActive}
          </span>
        </div>

        <div style={{ display: "grid", gap: 7 }}>
          <p style={labelStyle}>{text.themeLabel}</p>
          <div style={{ display: "flex", gap: 8 }}>
            {themeNames.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={room.theme === name}
                onClick={() => onSetTheme(name)}
                style={{ ...chipStyle(room.theme === name), flex: 1 }}
              >
                {name === "dark" ? text.themeDark : text.themeLight}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 7 }}>
          <p style={labelStyle}>{text.languageLabel}</p>
          <div style={{ display: "flex", gap: 8 }}>
            {supportedLanguages.map((language) => (
              <button
                key={language}
                type="button"
                aria-pressed={room.language === language}
                onClick={() => onSetLanguage(language)}
                style={{ ...chipStyle(room.language === language), flex: 1 }}
              >
                {languageLabels[language]}
              </button>
            ))}
          </div>
        </div>

        <button type="button" style={actionStyle} onClick={() => setOpen(false)}>
          {text.hostMenuResume}
        </button>
        <button
          type="button"
          style={secondaryActionStyle}
          onClick={() => {
            setOpen(false);
            onBackToMenu();
          }}
        >
          {text.hostMenuToMainMenu}
        </button>
        <button
          type="button"
          style={secondaryActionStyle}
          onClick={() => {
            // Resume before giving the controls up, not after: the effect's
            // cleanup runs on the next commit, by which point this phone no
            // longer drives the room and the server would refuse to unfreeze
            // it. The duplicate resume from that cleanup is a no-op.
            onSetPaused(false);
            setOpen(false);
            onReleaseControl();
          }}
        >
          {text.hostControlRelease}
        </button>
      </div>
    </div>
  );
}
