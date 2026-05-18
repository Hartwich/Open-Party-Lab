import type { SupportedLanguage } from "@open-party-lab/protocol";
import type { StoredControllerSession } from "../app/deviceSession.js";
import { ControllerFrame } from "../controller-ui/layout/ControllerFrame.js";
import { getControllerText } from "../i18n/controllerText.js";

interface ReconnectPageProps {
  connected: boolean;
  storedSession: StoredControllerSession | null;
  error: string | null;
  language: SupportedLanguage;
  onReconnect: () => void;
  onReset: () => void;
}

export function ReconnectPage({
  connected,
  storedSession,
  error,
  language,
  onReconnect,
  onReset
}: ReconnectPageProps) {
  const text = getControllerText(language);

  return (
    <ControllerFrame
      title={text.reconnectTitle}
      subtitle={text.reconnectSubtitle}
    >
      <div style={{ display: "grid", gap: 12 }}>
        {storedSession ? (
          <div
            style={{
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
              background: "rgba(15, 23, 42, 0.52)"
            }}
          >
            <strong>{storedSession.playerName}</strong>
            <div style={{ color: "var(--text-muted)", marginTop: 6 }}>
              {text.room} {storedSession.roomCode}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onReconnect}
          disabled={!connected}
          style={{ ...primaryButtonStyle, opacity: connected ? 1 : 0.6 }}
        >
          {connected ? text.continueSession : text.connectingController}
        </button>
        <button type="button" onClick={onReset} style={secondaryButtonStyle}>
          {text.discardLocalSession}
        </button>
        {error ? <p style={{ color: "var(--danger)", marginBottom: 0 }}>{error}</p> : null}
      </div>
    </ControllerFrame>
  );
}

const primaryButtonStyle = {
  border: 0,
  borderRadius: "var(--radius-md)",
  background: "var(--accent)",
  color: "#082f49",
  padding: "16px 20px",
  fontWeight: 800
} as const;

const secondaryButtonStyle = {
  border: "1px solid var(--panel-border)",
  borderRadius: "var(--radius-md)",
  background: "transparent",
  color: "var(--text-main)",
  padding: "16px 20px",
  fontWeight: 700
} as const;
