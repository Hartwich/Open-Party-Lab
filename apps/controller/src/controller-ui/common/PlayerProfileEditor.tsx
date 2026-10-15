import { useRef, useState } from "react";
import type { PlayerSnapshot, SupportedLanguage } from "@open-party-lab/protocol";
import { getProfileText } from "../../i18n/profileText.js";
import { compressPartyImage } from "../layouts/socialPartyMedia.js";

interface Props {
  player: PlayerSnapshot;
  language: SupportedLanguage;
  onSave: (name: string, avatar: string | null) => Promise<string | null>;
}

export function PlayerProfileEditor({ player, language, onSave }: Props) {
  const text = getProfileText(language);
  const [name, setName] = useState(player.name);
  const [avatar, setAvatar] = useState(player.avatar ?? null);
  const [busy, setBusy] = useState<"photo" | "save" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  async function choosePhoto(file?: File) {
    if (!file || busy) return;
    setBusy("photo");
    setMessage(null);
    try { setAvatar(await compressPartyImage(file, 35_000)); }
    catch { setMessage(text.photoError); }
    finally { setBusy(null); }
  }

  return (
    <details className="player-profile">
      <summary>{text.title}</summary>
      <form onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setBusy("save");
        setMessage(null);
        try { setMessage(await onSave(name.trim(), avatar) ?? text.saved); }
        finally { setBusy(null); }
      }}>
        <input aria-label={text.name} value={name} maxLength={32} required disabled={Boolean(busy)} onChange={(event) => setName(event.target.value)} />
        <button className="player-profile-photo" type="button" aria-label={text.changePhoto} disabled={Boolean(busy)} onClick={() => photoInput.current?.click()}>
          {avatar ? <img src={avatar} alt={text.preview} width={112} height={112} /> : <span className="player-profile-initials" aria-hidden="true">{name.trim().slice(0, 2).toUpperCase() || "?"}</span>}
          <span className="player-profile-camera" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></svg></span>
        </button>
        {/* No capture attribute: let the phone offer both camera and library. */}
        <input ref={photoInput} type="file" aria-label={text.changePhoto} accept="image/*" hidden disabled={Boolean(busy)} onChange={(event) => { void choosePhoto(event.target.files?.[0]); event.target.value = ""; }} />
        {avatar && <button type="button" disabled={Boolean(busy)} onClick={() => { setAvatar(null); setMessage(null); }}>{text.remove}</button>}
        <button type="submit" disabled={Boolean(busy) || !name.trim()}>{busy === "photo" ? text.preparing : busy === "save" ? text.saving : text.save}</button>
        {message && <p role="status">{message}</p>}
      </form>
    </details>
  );
}
