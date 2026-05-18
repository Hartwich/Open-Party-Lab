import { useState } from "react";
import type { SupportedLanguage } from "@open-party-lab/protocol";
import { ControllerFrame } from "../controller-ui/layout/ControllerFrame.js";
import { getControllerText } from "../i18n/controllerText.js";

interface JoinPageProps {
  defaultRoomCode: string;
  connected: boolean;
  error: string | null;
  language: SupportedLanguage;
  onJoin: (roomCode: string, playerName: string) => void;
}

export function JoinPage({ defaultRoomCode, connected, error, language, onJoin }: JoinPageProps) {
  const [roomCode, setRoomCode] = useState(defaultRoomCode);
  const [playerName, setPlayerName] = useState("");
  const text = getControllerText(language);

  return (
    <ControllerFrame
      title={text.joinTitle}
      subtitle={text.joinSubtitle}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onJoin(roomCode.trim().toUpperCase(), playerName.trim());
        }}
        style={{ display: "grid", gap: 16 }}
      >
        <label style={{ display: "grid", gap: 8 }}>
          <span>{text.roomCode}</span>
          <input
            value={roomCode}
            maxLength={4}
            required
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span>{text.name}</span>
          <input
            value={playerName}
            required
            onChange={(event) => setPlayerName(event.target.value)}
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={!connected} style={{ ...primaryButtonStyle, opacity: connected ? 1 : 0.6 }}>
          {connected ? text.joinRoom : text.connectingController}
        </button>
      </form>

      <p style={{ color: connected ? "var(--success)" : "var(--text-muted)", marginBottom: 0 }}>
        {connected ? text.serverConnected : text.serverNotConnected}
      </p>
      {error ? <p style={{ color: "var(--danger)", marginBottom: 0 }}>{error}</p> : null}
    </ControllerFrame>
  );
}

const inputStyle = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--panel-border)",
  background: "rgba(15, 23, 42, 0.6)",
  color: "var(--text-main)",
  padding: "14px 16px"
} as const;

const primaryButtonStyle = {
  border: 0,
  borderRadius: "var(--radius-md)",
  background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)",
  color: "#042f2e",
  padding: "16px 20px",
  fontWeight: 800
} as const;
