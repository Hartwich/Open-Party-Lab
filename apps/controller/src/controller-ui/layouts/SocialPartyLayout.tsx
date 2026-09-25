import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { SocialPartyLayoutModel } from "./models.js";

type Props = { model: SocialPartyLayoutModel };
type Stroke = { color: string; points: Array<{ x: number; y: number }> };
const INK = ["#352436", "#ed715e", "#399b91", "#e6b33e", "#657db5"];

function ToolIcon({ kind }: { kind: "photo" | "undo" | "clear" }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {kind === "photo" ? <><path d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></>
      : kind === "undo" ? <><path d="M9 7 4 12l5 5" /><path d="M4 12h10a6 6 0 0 1 6 6" /></>
        : <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></>}
  </svg>;
}

async function compressImage(file: File, maxChars = 85_000): Promise<string> {
  if (!file.type.startsWith("image/") || file.size > 20_000_000) throw new Error("invalid image");
  const source = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  try {
    for (const maxSide of [640, 512, 384, 256]) {
      const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
      canvas.width = Math.max(1, Math.round(source.width * scale));
      canvas.height = Math.max(1, Math.round(source.height * scale));
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.7, 0.56, 0.42]) {
        const data = canvas.toDataURL("image/jpeg", quality);
        if (data.length <= maxChars) return data;
      }
    }
  } finally { source.close(); }
  throw new Error("image too large");
}

export function SocialPartyLayout({ model }: Props) {
  const en = model.language === "en";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const photoImageRef = useRef<{ src: string; image: HTMLImageElement } | null>(null);
  const uploadIdRef = useRef(0);
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(INK[0]);
  const [imageError, setImageError] = useState(false);
  const [photoReady, setPhotoReady] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setDraft(""); setPhoto(model.basePhoto ?? null); setStrokes([]); setImageError(false); setPhotoReady(!model.basePhoto); setUploading(false);
    photoImageRef.current = null;
    uploadIdRef.current += 1;
  }, [model.resetKey, model.basePhoto]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, 640, 480);
    ctx.fillStyle = "#fffdf8"; ctx.fillRect(0, 0, 640, 480);
    const paint = () => {
      for (const stroke of strokes) {
        if (!stroke.points.length) continue;
        ctx.beginPath(); ctx.strokeStyle = stroke.color; ctx.fillStyle = stroke.color;
        ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.moveTo(stroke.points[0].x * 640, stroke.points[0].y * 480);
        for (const point of stroke.points.slice(1)) ctx.lineTo(point.x * 640, point.y * 480);
        if (stroke.points.length === 1) { ctx.arc(stroke.points[0].x * 640, stroke.points[0].y * 480, 4, 0, Math.PI * 2); ctx.fill(); }
        else ctx.stroke();
      }
    };
    if (!photo) { paint(); return; }
    let active = true;
    const drawPhoto = (image: HTMLImageElement) => {
      if (!active) return;
      const scale = Math.min(640 / image.width, 480 / image.height);
      const w = image.width * scale, h = image.height * scale;
      ctx.drawImage(image, (640 - w) / 2, (480 - h) / 2, w, h); paint(); setPhotoReady(true);
    };
    const cached = photoImageRef.current;
    const image = cached?.src === photo ? cached.image : new Image();
    if (cached?.src !== photo) { photoImageRef.current = { src: photo, image }; image.src = photo; }
    if (image.complete && image.naturalWidth > 0) drawPhoto(image);
    else {
      image.onload = () => drawPhoto(image);
      image.onerror = () => { if (active) { setImageError(true); setPhotoReady(false); } };
    }
    return () => { active = false; };
  }, [photo, strokes]);

  const onImage = async (file?: File) => {
    if (!file) return;
    const uploadId = ++uploadIdRef.current;
    setUploading(true);
    try {
      const nextPhoto = await compressImage(file, model.stage === "avatar" ? 35_000 : 85_000);
      if (uploadId !== uploadIdRef.current) return;
      setPhotoReady(false); setPhoto(nextPhoto); setImageError(false); setUploading(false);
    } catch { if (uploadId === uploadIdRef.current) { setImageError(true); setUploading(false); } }
  };
  const openFileWithKeyboard = (event: React.KeyboardEvent<HTMLLabelElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.currentTarget.querySelector("input")?.click();
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
    for (const maxSide of [640, 512, 384, 256]) {
      const output = document.createElement("canvas");
      const scale = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
      output.width = Math.max(1, Math.round(canvas.width * scale)); output.height = Math.max(1, Math.round(canvas.height * scale));
      const ctx = output.getContext("2d"); if (!ctx) continue;
      ctx.drawImage(canvas, 0, 0, output.width, output.height);
      for (const quality of [0.7, 0.56, 0.42]) {
        const data = output.toDataURL("image/jpeg", quality);
        if (data.length <= 85_000) { model.onSubmitMedia(data, strokes.length); setImageError(false); return; }
      }
    }
    setImageError(true);
  };
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (draft.trim()) model.onSubmitText(draft.trim()); };
  const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 18, background: "#422b42", color: "#fffaf2", minHeight: 54, padding: "14px 18px", fontSize: 16, fontWeight: 750, boxShadow: "0 5px 0 #2c1d2d", touchAction: "manipulation" };
  const disabled = Boolean(model.disabled || model.hasSubmitted || (model.stage !== "submit" && model.stage !== "avatar"));

  return <main className="social-party" key={model.resetKey} aria-label={en ? "Blickwinkel controller" : "Blickwinkel-Eingabe"}>
    <style>{`
      .social-party{--paper:#fffaf1;--plum:#39283c;--coral:#e97763;--teal:#398f87;color:var(--plum);font-family:Georgia,'Times New Roman',serif;display:grid;align-content:start;gap:12px;padding:clamp(14px,4vw,24px);min-height:100%;background:radial-gradient(ellipse at 92% 4%,#f8ded4 0,transparent 32%),radial-gradient(ellipse at 0 75%,#d9eee8 0,transparent 35%),#f5eee2;animation:sp-in .38s cubic-bezier(.2,.8,.2,1) both}
      .sp-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.sp-kicker{font:700 11px/1.2 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.16em;color:var(--teal)}.sp-round{font:700 12px system-ui,sans-serif;padding:8px 12px;border-radius:99px;background:#fff9;}
      .sp-prompt{font-size:clamp(27px,7vw,38px);line-height:1.08;letter-spacing:-.035em;margin:0;max-width:22ch}.sp-helper{font:14px/1.45 system-ui,sans-serif;color:#746878;margin:0}.sp-paper{background:var(--paper);border-radius:6px 18px 18px 18px;padding:18px;box-shadow:0 3px 0 #decfc2,0 14px 34px #49364812;animation:sp-rise .42s both}
      .sp-actions{display:grid;gap:11px}.sp-choice{width:100%;text-align:left;background:#fffdf8;border:1px solid #e4d8ca;border-radius:14px;padding:15px;color:var(--plum);font:600 16px/1.35 system-ui,sans-serif;transition:transform .18s,background .18s,border-color .18s}.sp-choice:active{transform:scale(.985)}.sp-choice[aria-pressed=true]{border-color:var(--coral);background:#fff0e9;box-shadow:0 0 0 2px #e9776320}
      .sp-field{width:100%;box-sizing:border-box;border:1px solid #dccfc2;border-radius:14px;background:#fffdf8;padding:15px;color:var(--plum);font:16px/1.45 system-ui,sans-serif;resize:vertical}.sp-muted{font:13px system-ui,sans-serif;color:#817582}.sp-photo{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:5px 13px 13px 13px;background:#fffdf8;box-shadow:0 5px 14px #39283c20;transform:rotate(-1deg)}.sp-toolbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.sp-tool{border:1px solid #dfd2c5;background:#fffdf8;color:var(--plum);border-radius:99px;padding:10px 13px;font:650 13px system-ui,sans-serif;min-height:42px}.sp-tool:focus-visible,.sp-choice:focus-visible{outline:3px solid var(--teal);outline-offset:3px}.sp-canvas{display:block;width:100%;aspect-ratio:4/3;border-radius:5px 14px 14px 14px;box-shadow:0 5px 14px #39283c20;touch-action:none;background:#fffdf8}.sp-results{display:grid;gap:12px}.sp-result{display:grid;gap:8px}.sp-score{display:flex;justify-content:space-between;gap:10px;font:600 14px system-ui,sans-serif;border-bottom:1px solid #e7ddd2;padding:9px 0}.sp-caption{font:12px system-ui,sans-serif;color:#746878}.sp-progress{height:6px;background:#e7ddd2;border-radius:9px;overflow:hidden}.sp-progress i{display:block;height:100%;background:var(--teal);transition:width .35s}
      .sp-choice{display:flex;align-items:center;gap:14px}.sp-choice-avatar{width:54px;height:54px;flex:none;border-radius:50%;object-fit:cover;background:#e9d9cc;display:grid;place-items:center;font:800 24px system-ui,sans-serif;color:#4a354c}.sp-choice:disabled{opacity:.55}.sp-photo.is-avatar{aspect-ratio:1;max-width:320px;margin:auto;border-radius:50%;transform:none}.sp-status-mark{display:grid;place-items:center;margin:18vh auto 0;width:72px;height:72px;border-radius:50%;background:#fff9;color:var(--teal);font:800 40px system-ui,sans-serif;box-shadow:0 8px 22px #39283c12}
      .sp-color-tool,.sp-icon-tool{width:44px;height:44px;min-height:44px;padding:0;display:grid;place-items:center;border-radius:12px}.sp-color-tool span{width:24px;height:24px;border-radius:50%}.sp-color-tool[aria-pressed=true]{border-color:var(--plum);box-shadow:0 0 0 2px var(--plum)}.sp-icon-tool svg{display:block}
      @keyframes sp-in{from{opacity:0}to{opacity:1}}@keyframes sp-rise{from{opacity:0;transform:translateY(9px) rotate(-.5deg)}to{opacity:1;transform:translateY(0) rotate(0)}}
      @media (prefers-reduced-motion:reduce){.social-party,.sp-paper{animation:none}.sp-choice,.sp-progress i{transition:none}}
    `}</style>
    {model.stage === "avatar" && !model.hasSubmitted && <section className="sp-actions"><label className="sp-tool" role="button" tabIndex={0} onKeyDown={openFileWithKeyboard} style={{ display: "inline-flex", justifyContent: "center", cursor: "pointer" }}>{en ? "Take character selfie" : "Charakter-Selfie aufnehmen"}<input aria-label={en ? "Take character selfie" : "Charakter-Selfie aufnehmen"} type="file" accept="image/*" capture="user" hidden onChange={(e) => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ""; void onImage(file); }} /></label>{imageError && <p className="sp-caption" role="alert">{en ? "Please choose a smaller photo." : "Bitte wähle ein kleineres Foto."}</p>}{photo && <><img className="sp-photo is-avatar" src={photo} alt={en ? "Character photo preview" : "Vorschau deines Charakterfotos"} /><button style={buttonStyle} type="button" disabled={uploading} onClick={() => model.onSubmitAvatar(photo)}>{en ? "Use this photo" : "Dieses Foto verwenden"}</button></>}</section>}
    {model.stage === "submit" && !model.hasSubmitted && <section className="sp-actions" key={model.taskKind}>
      {model.taskKind === "pick" && model.choices.map((choice, i) => <button key={choice.id} className="sp-choice" disabled={disabled} style={{ animation: `sp-rise .3s ${i * 45}ms both` }} type="button" onClick={() => model.onSubmitPick(choice.id)}>{choice.avatar ? <img className="sp-choice-avatar" src={choice.avatar} alt="" /> : <span className="sp-choice-avatar">{choice.label.slice(0, 1)}</span>}<span>{choice.label}</span></button>)}
      {model.taskKind === "text" && <form onSubmit={submit} className="sp-actions"><textarea className="sp-field" maxLength={180} rows={4} value={draft} disabled={disabled} aria-label={en ? "Your answer" : "Deine Antwort"} onChange={(e) => setDraft(e.target.value)} placeholder={en ? "Write your answer…" : "Schreib deine Antwort …"} /><button style={buttonStyle} disabled={disabled || !draft.trim()}>{en ? "Send" : "Absenden"}</button></form>}
      {model.taskKind === "photo" && <><label className="sp-tool" role="button" tabIndex={disabled ? -1 : 0} onKeyDown={openFileWithKeyboard} style={{ display: "inline-flex", justifyContent: "center", cursor: "pointer" }}>{en ? "Take or choose a photo" : "Foto aufnehmen oder auswählen"}<input aria-label={en ? "Choose photo" : "Foto auswählen"} type="file" accept="image/*" disabled={disabled} hidden onChange={(e) => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ""; void onImage(file); }} /></label>{imageError && <p className="sp-caption" role="alert">{en ? "That image could not be compressed safely. Try another, smaller photo." : "Das Bild konnte nicht klein genug komprimiert werden. Bitte nutze ein kleineres Foto."}</p>}{photo && <><img className="sp-photo" src={photo} alt={en ? "Your photo preview" : "Vorschau deines Fotos"} /><button style={buttonStyle} type="button" disabled={disabled || uploading} onClick={() => model.onSubmitMedia(photo)}>{en ? "Send photo" : "Foto senden"}</button></>}</>}
      {model.taskKind === "draw" && <>
        <div className="sp-toolbar">
          {INK.map((swatch) => <button type="button" key={swatch} className="sp-tool sp-color-tool" aria-label={`${en ? "Color" : "Farbe"} ${swatch}`} aria-pressed={color === swatch} disabled={disabled} onClick={() => setColor(swatch)}><span style={{ background: swatch }} /></button>)}
          {!model.basePhoto && <label className="sp-tool sp-icon-tool" role="button" tabIndex={disabled ? -1 : 0} aria-label={en ? "Add photo" : "Foto als Vorlage"} onKeyDown={openFileWithKeyboard} style={{ cursor: "pointer" }}><ToolIcon kind="photo" /><input type="file" accept="image/*" disabled={disabled} hidden onChange={(e) => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ""; void onImage(file); }} /></label>}
          <button className="sp-tool sp-icon-tool" type="button" aria-label={en ? "Undo" : "Rückgängig"} disabled={disabled || !strokes.length} onClick={() => setStrokes((v) => v.slice(0, -1))}><ToolIcon kind="undo" /></button>
          <button className="sp-tool sp-icon-tool" type="button" aria-label={en ? "Clear strokes" : "Striche löschen"} disabled={disabled} onClick={() => { uploadIdRef.current += 1; setUploading(false); setStrokes([]); setPhoto(model.basePhoto ?? null); setPhotoReady(true); }}><ToolIcon kind="clear" /></button>
        </div>
        {model.maxStrokes && <p className="sp-caption" aria-live="polite">{strokes.length} / {model.maxStrokes} {en ? "strokes" : "Striche"}</p>}
        {imageError && <p className="sp-caption" role="alert">{en ? "Photo or drawing could not be compressed. Try a smaller image." : "Foto oder Zeichnung konnte nicht klein genug komprimiert werden."}</p>}
        <canvas ref={canvasRef} className="sp-canvas" width={640} height={480} aria-label={en ? "Drawing canvas" : "Zeichenfläche"} onPointerDown={(e) => { if (disabled || (model.maxStrokes && strokes.length >= model.maxStrokes)) return; e.currentTarget.setPointerCapture(e.pointerId); drawingRef.current = true; const p = point(e); setStrokes((current) => [...current, { color, points: [p] }]); }} onPointerMove={(e) => { if (drawingRef.current) addPoint(e); }} onPointerUp={() => { drawingRef.current = false; }} onPointerCancel={() => { drawingRef.current = false; }} />
        <button style={buttonStyle} type="button" disabled={disabled || uploading || !strokes.length || !photoReady} onClick={submitDrawing}>{en ? "Send drawing" : "Zeichnung senden"}</button>
      </>}
    </section>}
    {(model.stage === "avatar" || model.stage === "submit") && model.hasSubmitted && <span className="sp-status-mark" role="status" aria-label={en ? "Submitted" : "Abgegeben"}>✓</span>}
    {model.stage === "vote" && <section className="sp-results">{model.choices.map((choice, i) => <button className="sp-choice" key={choice.id} type="button" disabled={Boolean(model.disabled || choice.disabled || model.hasSubmitted)} aria-pressed={model.selectedId === choice.id} onClick={() => model.onVote(choice.id)} style={{ animation: `sp-rise .3s ${i * 45}ms both` }}><span className="sp-choice-avatar">{choice.avatar ? <img className="sp-choice-avatar" src={choice.avatar} alt="" /> : choice.label.slice(0, 1)}</span><span>{choice.label}</span></button>)}</section>}
    {(model.stage === "waiting" || model.stage === "finished") && <span className="sp-status-mark" role="status" aria-label={en ? "Watch the shared screen" : "Auf den Hauptbildschirm schauen"}>✓</span>}
    {model.ready && <ReadyPanel ready={model.ready} />}
  </main>;
}
