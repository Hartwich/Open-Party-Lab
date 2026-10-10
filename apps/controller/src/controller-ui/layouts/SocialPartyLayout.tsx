import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { SocialPartyLayoutModel } from "./models.js";
import { compressPartyImage, encodePartyCanvas, SocialPartyMediaError } from "./socialPartyMedia.js";

type Props = { model: SocialPartyLayoutModel };
type Stroke = { color: string; points: Array<{ x: number; y: number }> };
const INK = ["#352436", "#ed715e", "#399b91", "#e6b33e", "#657db5"];

function RoundTimer({ deadline, en, getServerTime = Date.now }: { deadline: number; en: boolean; getServerTime?: () => number }) {
  const [now, setNow] = useState(getServerTime);
  useEffect(() => {
    setNow(getServerTime());
    const timer = window.setInterval(() => setNow(getServerTime()), 250);
    return () => window.clearInterval(timer);
  }, [deadline, getServerTime]);
  return <span role="timer" aria-label={en ? "Seconds remaining" : "Verbleibende Sekunden"} style={{ font: "700 28px ui-monospace, monospace", fontVariantNumeric: "tabular-nums" }}>{Math.max(0, Math.ceil((deadline - now) / 1000))} s</span>;
}

function ToolIcon({ kind }: { kind: "photo" | "gallery" | "undo" | "clear" }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {kind === "photo" ? <><path d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></>
      : kind === "gallery" ? <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1" /><path d="m3 17 5-5 4 4 4-6 5 7" /></>
      : kind === "undo" ? <><path d="M9 7 4 12l5 5" /><path d="M4 12h10a6 6 0 0 1 6 6" /></>
        : <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></>}
  </svg>;
}

function PhotoPicker({ en, selfie = false, compact = false, disabled, onImage }: { en: boolean; selfie?: boolean; compact?: boolean; disabled: boolean; onImage(file?: File): void }) {
  const change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; onImage(file);
  };
  const keyboard = (event: React.KeyboardEvent<HTMLLabelElement>) => {
    if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault(); event.currentTarget.querySelector("input")?.click();
  };
  const cameraLabel = selfie ? (en ? "Take selfie" : "Selfie aufnehmen") : (en ? "Take photo" : "Foto aufnehmen");
  const galleryLabel = en ? "Choose photo" : "Foto auswählen";
  return <div className="sp-photo-tools">
    <label className={`sp-tool ${compact ? "sp-icon-tool" : "sp-camera"}`} role="button" aria-label={cameraLabel} title={cameraLabel} aria-disabled={disabled} tabIndex={disabled ? -1 : 0} onKeyDown={keyboard}><ToolIcon kind="photo" />{!compact && <span>{cameraLabel}</span>}<input type="file" aria-label={cameraLabel} accept="image/*" capture={selfie ? "user" : "environment"} disabled={disabled} hidden onChange={change} /></label>
    <label className="sp-tool sp-icon-tool" role="button" aria-label={galleryLabel} title={galleryLabel} aria-disabled={disabled} tabIndex={disabled ? -1 : 0} onKeyDown={keyboard}><ToolIcon kind="gallery" /><input type="file" aria-label={galleryLabel} accept="image/*" disabled={disabled} hidden onChange={change} /></label>
  </div>;
}

export function SocialPartyLayout({ model }: Props) {
  const en = model.language === "en";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const photoImageRef = useRef<{ src: string; image: HTMLImageElement } | null>(null);
  const uploadIdRef = useRef(0);
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(INK[0]);
  const [imageError, setImageError] = useState<SocialPartyMediaError["code"] | null>(null);
  const [photoReady, setPhotoReady] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [showSecret, setShowSecret] = useState(model.secret?.initiallyVisible ?? false);
  const autoReadySent = useRef(false);
  const automaticReady = Boolean(model.ready && model.autoReady?.enabled && !model.ready.currentPlayerReady);
  useEffect(() => {
    if (!automaticReady) { autoReadySent.current = false; return; }
    if (!autoReadySent.current) { autoReadySent.current = true; model.autoReady?.onReady(); }
  }, [automaticReady, model.autoReady?.onReady]);

  useEffect(() => {
    setDraft(""); setPhoto(model.basePhoto ?? null); setCanvasSize({ width: 640, height: 480 }); setStrokes([]); setImageError(null); setPhotoReady(!model.basePhoto); setUploading(false); setSending(false); setSendError(false); setShowSecret(model.secret?.initiallyVisible ?? false);
    photoImageRef.current = null;
    uploadIdRef.current += 1;
  }, [model.resetKey, model.basePhoto, model.secret?.initiallyVisible]);

  useEffect(() => () => { uploadIdRef.current += 1; }, []);
  useEffect(() => {
    if (model.hasSubmitted || (model.stage !== "avatar" && model.stage !== "submit")) { setSending(false); setSendError(false); return; }
    if (!sending) return;
    const timeout = window.setTimeout(() => { setSending(false); setSendError(true); }, 8_000);
    return () => window.clearTimeout(timeout);
  }, [sending, model.hasSubmitted, model.stage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fffdf8"; ctx.fillRect(0, 0, width, height);
    const paint = () => {
      for (const stroke of strokes) {
        if (!stroke.points.length) continue;
        ctx.beginPath(); ctx.strokeStyle = stroke.color; ctx.fillStyle = stroke.color;
        ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
        for (const point of stroke.points.slice(1)) ctx.lineTo(point.x * width, point.y * height);
        if (stroke.points.length === 1) { ctx.arc(stroke.points[0].x * width, stroke.points[0].y * height, 4, 0, Math.PI * 2); ctx.fill(); }
        else ctx.stroke();
      }
    };
    if (!photo) { paint(); return; }
    let active = true;
    const drawPhoto = (image: HTMLImageElement) => {
      if (!active) return;
      const scale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
      const nextWidth = Math.max(1, Math.round(image.naturalWidth * scale));
      const nextHeight = Math.max(1, Math.round(image.naturalHeight * scale));
      if (width !== nextWidth || height !== nextHeight) {
        setPhotoReady(false); setCanvasSize({ width: nextWidth, height: nextHeight }); return;
      }
      ctx.drawImage(image, 0, 0, width, height); paint(); setPhotoReady(true);
    };
    const cached = photoImageRef.current;
    const image = cached?.src === photo ? cached.image : new Image();
    if (cached?.src !== photo) { photoImageRef.current = { src: photo, image }; image.src = photo; }
    if (image.complete && image.naturalWidth > 0) drawPhoto(image);
    else {
      image.onload = () => drawPhoto(image);
      image.onerror = () => { if (active) { setImageError("decode"); setPhotoReady(false); } };
    }
    return () => { active = false; };
  }, [photo, strokes, model.stage, canvasSize.width, canvasSize.height]);

  const onImage = async (file?: File) => {
    if (!file) return;
    const uploadId = ++uploadIdRef.current;
    setUploading(true);
    try {
      const nextPhoto = await compressPartyImage(file, model.stage === "avatar" ? 35_000 : 85_000);
      if (uploadId !== uploadIdRef.current) return;
      setPhotoReady(model.taskKind !== "draw"); setPhoto(nextPhoto); setStrokes([]); setImageError(null); setUploading(false); setSendError(false);
    } catch (error) { if (uploadId === uploadIdRef.current) { setImageError(error instanceof SocialPartyMediaError ? error.code : "decode"); setUploading(false); } }
  };
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  };
  const addPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const p = point(event);
    setStrokes((current) => {
      if (!current.length || !drawingRef.current) return [...current, { color, points: [p] }];
      const next = [...current]; next[next.length - 1] = { ...next[next.length - 1], points: [...next[next.length - 1].points, p] }; return next;
    });
  };
  const submitDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try { const data = encodePartyCanvas(canvas); sendMedia(() => model.onSubmitMedia(data, strokes.length)); setImageError(null); }
    catch { setImageError("encode"); }
  };
  const sendMedia = (send: () => void) => {
    if (sending || model.hasSubmitted || model.connected === false) return;
    setSending(true); setSendError(false);
    try { send(); } catch { setSending(false); setSendError(true); }
  };
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (draft.trim()) model.onSubmitText(draft.trim()); };
  const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 18, background: "#422b42", color: "#fffaf2", minHeight: 54, padding: "14px 18px", fontSize: 16, fontWeight: 750, boxShadow: "0 5px 0 #2c1d2d", touchAction: "manipulation" };
  const disabled = Boolean(model.disabled || model.hasSubmitted || sending || (model.stage !== "submit" && model.stage !== "avatar"));
  const photoDisabled = disabled || uploading;
  const imageErrorText = imageError === "size" ? (en ? "Photo too large (maximum 50 MB)." : "Foto zu groß (maximal 50 MB).")
    : imageError === "format" || imageError === "decode" ? (en ? "Photo unreadable. Try a JPEG or another photo." : "Foto nicht lesbar. Versuche ein JPEG oder ein anderes Foto.")
    : (en ? "Photo could not be prepared. Try another photo." : "Foto konnte nicht vorbereitet werden. Versuche ein anderes Foto.");
  const sendLabel = sending ? (en ? "Sending…" : "Wird gesendet …") : sendError ? (en ? "Send again" : "Erneut senden") : null;

  return <main className={`social-party${model.title ? " has-context" : ""}`} key={model.resetKey} aria-label={model.title ?? (en ? "Blickwinkel controller" : "Blickwinkel-Eingabe")}>
    {model.deadline !== undefined && <RoundTimer deadline={model.deadline} en={en} getServerTime={model.getServerTime} />}
    <style>{`
      .social-party{--paper:#fffaf1;--plum:#39283c;--coral:#e97763;--teal:#398f87;color:var(--plum);font-family:Georgia,'Times New Roman',serif;display:grid;align-content:center;justify-items:center;gap:12px;box-sizing:border-box;padding:72px clamp(14px,4vw,24px) 24px;min-height:calc(100dvh - max(10px,env(safe-area-inset-top)) - max(10px,env(safe-area-inset-bottom)));background:radial-gradient(ellipse at 92% 4%,#f8ded4 0,transparent 32%),radial-gradient(ellipse at 0 75%,#d9eee8 0,transparent 35%),#f5eee2;animation:sp-in .38s cubic-bezier(.2,.8,.2,1) both}
      .social-party>.sp-actions,.social-party>.sp-results{width:100%;max-width:480px;min-width:0}.social-party>.sp-actions>label.sp-tool{justify-self:center;max-width:100%;text-align:center;padding:14px 20px}.social-party>.sp-actions>.sp-photo{max-height:42dvh;object-fit:contain}.social-party>.sp-actions>.sp-photo.is-avatar{max-width:min(260px,38dvh)}
      .sp-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.sp-kicker{font:700 11px/1.2 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.16em;color:var(--teal)}.sp-round{font:700 12px system-ui,sans-serif;padding:8px 12px;border-radius:99px;background:#fff9;}
      .sp-prompt{font-size:clamp(27px,7vw,38px);line-height:1.08;letter-spacing:-.035em;margin:0;max-width:22ch}.sp-helper{font:14px/1.45 system-ui,sans-serif;color:#746878;margin:0}.sp-paper{background:var(--paper);border-radius:6px 18px 18px 18px;padding:18px;box-shadow:0 3px 0 #decfc2,0 14px 34px #49364812;animation:sp-rise .42s both}
      .sp-actions{display:grid;gap:11px}.sp-choice{width:100%;text-align:left;background:#fffdf8;border:1px solid #e4d8ca;border-radius:14px;padding:15px;color:var(--plum);font:600 16px/1.35 system-ui,sans-serif;transition:transform .18s,background .18s,border-color .18s}.sp-choice:active{transform:scale(.985)}.sp-choice[aria-pressed=true]{border-color:var(--coral);background:#fff0e9;box-shadow:0 0 0 2px #e9776320}
      .sp-field{width:100%;box-sizing:border-box;border:1px solid #dccfc2;border-radius:14px;background:#fffdf8;padding:15px;color:var(--plum);font:16px/1.45 system-ui,sans-serif;resize:vertical}.sp-muted{font:13px system-ui,sans-serif;color:#817582}.sp-photo{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:5px 13px 13px 13px;background:#fffdf8;box-shadow:0 5px 14px #39283c20;transform:rotate(-1deg)}.sp-toolbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.sp-tool{box-sizing:border-box;border:1px solid #dfd2c5;background:#fffdf8;color:var(--plum);border-radius:99px;padding:10px 13px;font:650 13px system-ui,sans-serif;min-height:42px}.sp-tool:focus-visible,.sp-choice:focus-visible{outline:3px solid var(--teal);outline-offset:3px}.sp-canvas{display:block;width:100%;aspect-ratio:4/3;border-radius:5px 14px 14px 14px;box-shadow:0 5px 14px #39283c20;touch-action:none;background:#fffdf8}.sp-results{display:grid;gap:12px}.sp-result{display:grid;gap:8px}.sp-score{display:flex;justify-content:space-between;gap:10px;font:600 14px system-ui,sans-serif;border-bottom:1px solid #e7ddd2;padding:9px 0}.sp-caption{font:12px system-ui,sans-serif;color:#746878}.sp-progress{height:6px;background:#e7ddd2;border-radius:9px;overflow:hidden}.sp-progress i{display:block;height:100%;background:var(--teal);transition:width .35s}
      .sp-choice{display:flex;align-items:center;gap:14px}.sp-choice-avatar{width:54px;height:54px;flex:none;border-radius:50%;object-fit:cover;background:#e9d9cc;display:grid;place-items:center;font:800 24px system-ui,sans-serif;color:#4a354c}.sp-choice:disabled{opacity:.55}.sp-photo.is-avatar{aspect-ratio:1;max-width:320px;margin:auto;border-radius:50%;transform:none}.sp-status-mark{display:grid;place-items:center;margin:0 auto;width:72px;height:72px;border-radius:50%;background:#fff9;color:var(--teal);font:800 40px system-ui,sans-serif;box-shadow:0 8px 22px #39283c12}
      .sp-color-tool,.sp-icon-tool{width:44px;height:44px;min-height:44px;padding:0;display:grid;place-items:center;border-radius:12px}.sp-color-tool span{width:24px;height:24px;border-radius:50%}.sp-color-tool[aria-pressed=true]{border-color:var(--plum);box-shadow:0 0 0 2px var(--plum)}.sp-icon-tool svg{display:block}
      .sp-photo-tools{display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap}.sp-camera{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:14px 20px;cursor:pointer}.sp-photo-tools label{cursor:pointer}.sp-photo-tools [aria-disabled=true]{opacity:.5;cursor:default}.social-party>.sp-caption{width:100%;max-width:480px;text-align:center;margin:0}
      .sp-actions.is-photo-edit .sp-canvas{grid-row:1;justify-self:center;max-width:100%;border-radius:12px}.sp-actions.is-photo-edit .sp-toolbar{grid-row:2;justify-content:center}
      @keyframes sp-in{from{opacity:0}to{opacity:1}}@keyframes sp-rise{from{opacity:0;transform:translateY(9px) rotate(-.5deg)}to{opacity:1;transform:translateY(0) rotate(0)}}
      @media (prefers-reduced-motion:reduce){.social-party,.sp-paper{animation:none}.sp-choice,.sp-progress i{transition:none}}
    `}</style>
    {model.title && <>
      <style>{`.social-party.has-context{align-content:start;gap:16px}.sp-context,.sp-secret,.sp-auto{width:100%;max-width:480px;box-sizing:border-box}.sp-context h1{font:700 clamp(34px,9vw,48px)/1.05 Georgia,serif;margin:6px 0 14px}.sp-context .sp-helper{font-size:16px}.sp-context .sp-head{font:750 13px system-ui,sans-serif}.sp-secret{border:1px solid #c7b7cc;background:#fffaf1;border-radius:6px;padding:22px 18px;min-height:112px;color:var(--plum);display:grid;gap:8px;text-align:center;cursor:pointer;animation:sp-rise .4s both}.sp-secret span{font:700 11px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#79647e}.sp-secret strong{font:700 clamp(25px,6vw,36px)/1.1 Georgia,serif;overflow-wrap:anywhere}.sp-secret small{font:12px system-ui,sans-serif;color:#79647e}.sp-auto{display:flex;align-items:center;gap:12px;font:650 15px system-ui,sans-serif;min-height:48px}.sp-auto input{width:24px;height:24px;accent-color:#6d587a}.social-party.has-context>.sp-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.has-context .sp-results .sp-choice{flex-direction:column;text-align:center;gap:8px;padding:14px 8px;overflow-wrap:anywhere}.has-context .sp-results .sp-choice-avatar{width:64px;height:64px}.has-context>section:has(.sp-status-mark){text-align:center}.has-context>.sp-actions .sp-photo.is-avatar{aspect-ratio:1;max-width:min(220px,30dvh)}.has-context>.sp-ready{width:100%;max-width:480px}.has-context .sp-choice:focus-visible,.sp-secret:focus-visible{outline:3px solid #6d587a;outline-offset:3px}@media(max-height:650px){.social-party.has-context{padding-top:58px;gap:12px}.sp-context h1{font-size:32px;margin-bottom:10px}.sp-secret{min-height:92px;padding:16px}}`}</style>
      <header className="sp-context"><div className="sp-head"><span className="sp-kicker">{model.title}</span>{model.score !== undefined && <span>{model.score} {en ? "points" : "Punkte"}</span>}</div><h1>{model.statusLabel ?? model.title}</h1>{model.helperText && <p className="sp-helper" role="status">{model.helperText}</p>}</header>
      {model.secret && <button className="sp-secret" type="button" aria-expanded={showSecret} onClick={() => setShowSecret((value) => !value)}><span>{model.secret.label}</span><strong>{showSecret ? model.secret.term : en ? "Tap to reveal" : "Tippen zum Anzeigen"}</strong><small>{showSecret ? (en ? "Tap to hide" : "Tippen zum Verbergen") : (en ? "For your eyes only" : "Nur für deine Augen")}</small></button>}
    </>}
    {model.stage === "avatar" && !model.hasSubmitted && <section className="sp-actions">
      <PhotoPicker en={en} selfie disabled={photoDisabled} onImage={(file) => { void onImage(file); }} />
      {photo && <><img className="sp-photo is-avatar" src={photo} alt={en ? "Character photo preview" : "Vorschau deines Charakterfotos"} /><button style={buttonStyle} type="button" disabled={photoDisabled || model.connected === false} onClick={() => sendMedia(() => model.onSubmitAvatar(photo))}>{sendLabel ?? (en ? "Use this photo" : "Dieses Foto verwenden")}</button></>}
    </section>}
    {model.stage === "submit" && !model.hasSubmitted && <section className={`sp-actions${model.taskKind === "draw" && photo ? " is-photo-edit" : ""}`} key={model.taskKind}>
      {model.taskKind === "pick" && model.choices.map((choice, i) => <button key={choice.id} className="sp-choice" disabled={disabled} style={{ animation: `sp-rise .3s ${i * 45}ms both` }} type="button" onClick={() => model.onSubmitPick(choice.id)}>{choice.avatar ? <img className="sp-choice-avatar" src={choice.avatar} alt="" /> : <span className="sp-choice-avatar">{choice.label.slice(0, 1)}</span>}<span>{choice.label}</span></button>)}
      {model.taskKind === "text" && <form onSubmit={submit} className="sp-actions"><textarea className="sp-field" maxLength={model.maxTextLength ?? 180} rows={4} value={draft} disabled={disabled} aria-label={en ? "Your answer" : "Deine Antwort"} onChange={(e) => setDraft(e.target.value)} placeholder={en ? "Write your answer…" : "Schreib deine Antwort …"} /><button style={buttonStyle} disabled={disabled || !draft.trim()}>{en ? "Send" : "Absenden"}</button></form>}
      {model.taskKind === "photo" && <>
        <PhotoPicker en={en} disabled={photoDisabled} onImage={(file) => { void onImage(file); }} />
        {photo && <><img className="sp-photo" src={photo} alt={en ? "Your photo preview" : "Vorschau deines Fotos"} /><button style={buttonStyle} type="button" disabled={photoDisabled || model.connected === false} onClick={() => sendMedia(() => model.onSubmitMedia(photo))}>{sendLabel ?? (en ? "Send photo" : "Foto senden")}</button></>}
      </>}
      {model.taskKind === "draw" && <>
        {model.requirePhoto && !photo && <PhotoPicker en={en} disabled={photoDisabled} onImage={(file) => { void onImage(file); }} />}
        {(!model.requirePhoto || photo) && <>
        <div className="sp-toolbar">
          {INK.map((swatch) => <button type="button" key={swatch} className="sp-tool sp-color-tool" aria-label={`${en ? "Color" : "Farbe"} ${swatch}`} aria-pressed={color === swatch} disabled={disabled} onClick={() => setColor(swatch)}><span style={{ background: swatch }} /></button>)}
          {!model.basePhoto && <PhotoPicker en={en} compact disabled={photoDisabled} onImage={(file) => { void onImage(file); }} />}
          <button className="sp-tool sp-icon-tool" type="button" aria-label={en ? "Undo" : "Rückgängig"} disabled={disabled || !strokes.length} onClick={() => setStrokes((v) => v.slice(0, -1))}><ToolIcon kind="undo" /></button>
          <button className="sp-tool sp-icon-tool" type="button" aria-label={en ? "Clear strokes" : "Striche löschen"} disabled={photoDisabled} onClick={() => { drawingRef.current = false; setStrokes([]); setImageError(null); }}><ToolIcon kind="clear" /></button>
        </div>
        {model.maxStrokes && <p className="sp-caption" aria-live="polite">{strokes.length} / {model.maxStrokes} {en ? "strokes" : "Striche"}</p>}
        <canvas ref={canvasRef} className="sp-canvas" width={canvasSize.width} height={canvasSize.height} style={{ aspectRatio: `${canvasSize.width}/${canvasSize.height}`, width: photo ? `min(100%, calc(max(160px, 100dvh - 280px) * ${canvasSize.width / canvasSize.height}))` : "100%" }} aria-label={en ? "Drawing canvas" : "Zeichenfläche"} onPointerDown={(e) => { if (photoDisabled || !photoReady || (model.maxStrokes && strokes.length >= model.maxStrokes)) return; e.currentTarget.setPointerCapture(e.pointerId); drawingRef.current = true; const p = point(e); setStrokes((current) => [...current, { color, points: [p] }]); }} onPointerMove={(e) => { if (drawingRef.current) addPoint(e); }} onPointerUp={() => { drawingRef.current = false; }} onPointerCancel={() => { drawingRef.current = false; }} />
        <button style={buttonStyle} type="button" disabled={photoDisabled || model.connected === false || !strokes.length || !photoReady || (model.requirePhoto && !photo)} onClick={submitDrawing}>{sendLabel ?? (en ? "Send drawing" : "Zeichnung senden")}</button>
        </>}
      </>}
    </section>}
    {(model.stage === "avatar" || model.stage === "submit") && !model.hasSubmitted && <>
      {uploading && <p className="sp-caption" role="status">{en ? "Preparing photo…" : "Foto wird vorbereitet …"}</p>}
      {imageError && <p className="sp-caption" role="alert">{imageErrorText}</p>}
      {model.connected === false ? <p className="sp-caption" role="status">{en ? "Reconnecting. Your photo is still here." : "Verbindung wird wiederhergestellt. Dein Foto bleibt erhalten."}</p>
        : sendError && <p className="sp-caption" role="alert">{en ? "Not confirmed yet. Please send again." : "Noch nicht bestätigt. Bitte erneut senden."}</p>}
    </>}
    {(model.stage === "avatar" || model.stage === "submit") && model.hasSubmitted && <span className="sp-status-mark" role="status" aria-label={en ? "Submitted" : "Abgegeben"}>✓</span>}
    {model.stage === "vote" && <section className="sp-results">{model.choices.map((choice, i) => <button className="sp-choice" key={choice.id} type="button" disabled={Boolean(model.disabled || choice.disabled || model.hasSubmitted)} aria-pressed={model.selectedId === choice.id} onClick={() => model.onVote(choice.id)} style={{ animation: `sp-rise .3s ${i * 45}ms both` }}><span className="sp-choice-avatar">{choice.avatar ? <img className="sp-choice-avatar" src={choice.avatar} alt="" /> : choice.label.slice(0, 1)}</span><span>{choice.label}</span></button>)}</section>}
    {!model.title && (model.stage === "waiting" || model.stage === "finished") && <span className="sp-status-mark" role="status" aria-label={en ? "Watch the shared screen" : "Auf den Hauptbildschirm schauen"}>✓</span>}
    {model.review && <section className="sp-actions" aria-label={model.review.title}>
      <h2 style={{ fontSize: 22, margin: "8px 0" }}>{model.review.title}</h2>
      {model.review.entries.map((entry) => <label key={entry.id} style={{ display: "grid", gap: 8, borderBottom: "1px solid #dfd2c5", padding: "8px 0 14px", font: "600 16px system-ui, sans-serif" }}>
        <span>{entry.label}</span>
        {model.review?.editable ? <select aria-label={`${en ? "Assign" : "Zuordnung"}: ${entry.label}`} value={entry.selectedId} onChange={(event) => model.review?.onAssign(entry.id, event.currentTarget.value)} style={{ minHeight: 48, width: "100%", minWidth: 0, padding: 10, borderRadius: 8, font: "inherit", background: "#fffdf8", color: "#39283c", border: "1px solid #c7b7cc" }}>
          <option value="">{model.review.unassignedLabel}</option>
          {model.review.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select> : <span>{model.review?.options.find((option) => option.id === entry.selectedId)?.label ?? model.review?.unassignedLabel}</span>}
        {entry.note && !entry.selectedId && <small>{entry.note}</small>}
      </label>)}
    </section>}
    {model.actions?.length ? <section className="sp-actions">{model.actions.map((action) => <button key={action.id} type="button" style={buttonStyle} disabled={action.disabled} onClick={action.onPress}>{action.label}</button>)}</section> : null}
    {model.autoReady && <label className="sp-auto"><input type="checkbox" checked={model.autoReady.enabled} onChange={(event) => model.autoReady?.onChange(event.currentTarget.checked)} /><span>{en ? "Automatically ready for the next word" : "Automatisch bereit für den nächsten Begriff"}</span></label>}
    {model.ready && <div className="sp-ready"><ReadyPanel ready={model.ready} /></div>}
  </main>;
}
