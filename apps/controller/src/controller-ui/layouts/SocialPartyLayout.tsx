import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ReadyPanel } from "../common/ReadyPanel.js";
import type { SocialPartyLayoutModel } from "./models.js";

type Props = { model: SocialPartyLayoutModel };
type Stroke = { color: string; points: Array<{ x: number; y: number }> };
const INK = ["#352436", "#ed715e", "#399b91", "#e6b33e", "#657db5"];

async function compressImage(file: File): Promise<string> {
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
        if (data.length <= 85_000) return data;
      }
    }
  } finally { source.close(); }
  throw new Error("image too large");
}

export function SocialPartyLayout({ model }: Props) {
  const en = model.language === "en";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoImageRef = useRef<{ src: string; image: HTMLImageElement } | null>(null);
  const uploadIdRef = useRef(0);
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(INK[0]);
  const [drawing, setDrawing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [photoReady, setPhotoReady] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (model.deadline === null) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [model.deadline]);

  useEffect(() => {
    setDraft(""); setPhoto(null); setStrokes([]); setImageError(false); setPhotoReady(true); setUploading(false);
    photoImageRef.current = null;
    uploadIdRef.current += 1;
  }, [model.resetKey]);

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
      const nextPhoto = await compressImage(file);
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
      if (!current.length || !drawing) return [...current, { color, points: [p] }];
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
        if (data.length <= 85_000) { model.onSubmitMedia(data); setImageError(false); return; }
      }
    }
    setImageError(true);
  };
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (draft.trim()) model.onSubmitText(draft.trim()); };
  const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 18, background: "#422b42", color: "#fffaf2", minHeight: 54, padding: "14px 18px", fontSize: 16, fontWeight: 750, boxShadow: "0 5px 0 #2c1d2d", touchAction: "manipulation" };
  const disabled = Boolean(model.disabled || model.hasSubmitted || model.stage !== "submit");
  const remainingMs = model.deadline === null ? null : Math.max(0, model.deadline - now);
  const progress = remainingMs === null ? 0 : Math.max(0, Math.min(100, remainingMs / Math.max(1, model.durationMs) * 100));
  const stageLabel = model.stage === "submit" ? (en ? "Your turn" : "Du bist dran") : model.stage === "vote" ? (en ? "Make your choice" : "Stimme ab") : model.stage === "reveal" ? (en ? "The reveal" : "Die Auflösung") : model.stage === "finished" ? (en ? "Game over" : "Spiel vorbei") : (en ? "One moment" : "Einen Moment");

  return <main className="social-party" key={model.resetKey}>
    <style>{`
      .social-party{--paper:#fffaf1;--plum:#39283c;--coral:#e97763;--teal:#398f87;color:var(--plum);font-family:Georgia,'Times New Roman',serif;display:grid;gap:20px;padding:clamp(14px,4vw,24px);min-height:100%;background:radial-gradient(ellipse at 92% 4%,#f8ded4 0,transparent 32%),radial-gradient(ellipse at 0 75%,#d9eee8 0,transparent 35%),#f5eee2;animation:sp-in .38s cubic-bezier(.2,.8,.2,1) both}
      .sp-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.sp-kicker{font:700 11px/1.2 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.16em;color:var(--teal)}.sp-round{font:700 12px system-ui,sans-serif;padding:8px 12px;border-radius:99px;background:#fff9;}
      .sp-prompt{font-size:clamp(27px,7vw,38px);line-height:1.08;letter-spacing:-.035em;margin:0;max-width:22ch}.sp-helper{font:14px/1.45 system-ui,sans-serif;color:#746878;margin:0}.sp-paper{background:var(--paper);border-radius:6px 18px 18px 18px;padding:18px;box-shadow:0 3px 0 #decfc2,0 14px 34px #49364812;animation:sp-rise .42s both}
      .sp-actions{display:grid;gap:11px}.sp-choice{width:100%;text-align:left;background:#fffdf8;border:1px solid #e4d8ca;border-radius:14px;padding:15px;color:var(--plum);font:600 16px/1.35 system-ui,sans-serif;transition:transform .18s,background .18s,border-color .18s}.sp-choice:active{transform:scale(.985)}.sp-choice[aria-pressed=true]{border-color:var(--coral);background:#fff0e9;box-shadow:0 0 0 2px #e9776320}
      .sp-field{width:100%;box-sizing:border-box;border:1px solid #dccfc2;border-radius:14px;background:#fffdf8;padding:15px;color:var(--plum);font:16px/1.45 system-ui,sans-serif;resize:vertical}.sp-muted{font:13px system-ui,sans-serif;color:#817582}.sp-photo{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:5px 13px 13px 13px;background:#fffdf8;box-shadow:0 5px 14px #39283c20;transform:rotate(-1deg)}.sp-toolbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.sp-tool{border:1px solid #dfd2c5;background:#fffdf8;color:var(--plum);border-radius:99px;padding:10px 13px;font:650 13px system-ui,sans-serif;min-height:42px}.sp-tool:focus-visible,.sp-choice:focus-visible{outline:3px solid var(--teal);outline-offset:3px}.sp-canvas{display:block;width:100%;aspect-ratio:4/3;border-radius:5px 14px 14px 14px;box-shadow:0 5px 14px #39283c20;touch-action:none;background:#fffdf8}.sp-results{display:grid;gap:12px}.sp-result{display:grid;gap:8px}.sp-score{display:flex;justify-content:space-between;gap:10px;font:600 14px system-ui,sans-serif;border-bottom:1px solid #e7ddd2;padding:9px 0}.sp-caption{font:12px system-ui,sans-serif;color:#746878}.sp-progress{height:6px;background:#e7ddd2;border-radius:9px;overflow:hidden}.sp-progress i{display:block;height:100%;background:var(--teal);transition:width .35s}
      @keyframes sp-in{from{opacity:0}to{opacity:1}}@keyframes sp-rise{from{opacity:0;transform:translateY(9px) rotate(-.5deg)}to{opacity:1;transform:translateY(0) rotate(0)}}
      @media (prefers-reduced-motion:reduce){.social-party,.sp-paper{animation:none}.sp-choice,.sp-progress i{transition:none}}
    `}</style>
    <header className="sp-head"><span className="sp-kicker">{stageLabel}</span><span className="sp-round">{model.roundLabel}</span></header>
    <section className="sp-paper"><h1 className="sp-prompt">{model.prompt}</h1>{model.helperText && <p className="sp-helper" style={{ marginTop: 10 }}>{model.helperText}</p>}
      {remainingMs !== null && (model.stage === "submit" || model.stage === "vote") && <div style={{ marginTop: 16 }}><span className="sp-muted" aria-live="off">{en ? "Time left" : "Noch Zeit"}: {Math.ceil(remainingMs / 1000)} s</span><div className="sp-progress" style={{ marginTop: 6 }}><i style={{ width: `${progress}%` }} /></div></div>}
    </section>
    {model.stage === "submit" && !model.hasSubmitted && <section className="sp-actions" key={model.taskKind}>
      {model.taskKind === "pick" && model.choices.map((choice, i) => <button key={choice.id} className="sp-choice" disabled={disabled} style={{ animation: `sp-rise .3s ${i * 45}ms both` }} type="button" onClick={() => model.onSubmitPick(choice.id)}>{choice.label}</button>)}
      {model.taskKind === "text" && <form onSubmit={submit} className="sp-actions"><textarea className="sp-field" maxLength={180} rows={4} value={draft} disabled={disabled} onChange={(e) => setDraft(e.target.value)} placeholder={en ? "Write your answer…" : "Schreib deine Antwort …"} /><div className="sp-head"><span className="sp-muted">{draft.length}/180</span><button style={buttonStyle} disabled={disabled || !draft.trim()}>{en ? "Send" : "Absenden"}</button></div></form>}
      {model.taskKind === "photo" && <><label className="sp-tool" role="button" tabIndex={disabled ? -1 : 0} onKeyDown={openFileWithKeyboard} style={{ display: "inline-flex", justifyContent: "center", cursor: "pointer" }}>{en ? "Take or choose a photo" : "Foto aufnehmen oder auswählen"}<input aria-label={en ? "Choose photo" : "Foto auswählen"} type="file" accept="image/*" disabled={disabled} hidden onChange={(e) => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ""; void onImage(file); }} /></label>{imageError && <p className="sp-caption" role="alert">{en ? "That image could not be compressed safely. Try another, smaller photo." : "Das Bild konnte nicht klein genug komprimiert werden. Bitte nutze ein kleineres Foto."}</p>}{photo && <><img className="sp-photo" src={photo} alt={en ? "Your photo preview" : "Vorschau deines Fotos"} /><button style={buttonStyle} type="button" disabled={disabled || uploading} onClick={() => model.onSubmitMedia(photo)}>{en ? "Send photo" : "Foto senden"}</button></>}</>}
      {model.taskKind === "draw" && <><div className="sp-toolbar">{INK.map((swatch) => <button type="button" key={swatch} className="sp-tool" aria-label={`${en ? "Color" : "Farbe"} ${swatch}`} aria-pressed={color === swatch} disabled={disabled} onClick={() => setColor(swatch)} style={{ borderColor: color === swatch ? swatch : undefined }}><span style={{ display: "inline-block", width: 14, height: 14, verticalAlign: "middle", borderRadius: 99, background: swatch, marginRight: 7 }} />{color === swatch ? (en ? "Selected" : "Aktiv") : ""}</button>)}<label className="sp-tool" role="button" tabIndex={disabled ? -1 : 0} onKeyDown={openFileWithKeyboard} style={{ cursor: "pointer" }}>{en ? "Add photo" : "Foto als Vorlage"}<input type="file" accept="image/*" disabled={disabled} hidden onChange={(e) => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ""; void onImage(file); }} /></label><button className="sp-tool" type="button" disabled={disabled || !strokes.length} onClick={() => setStrokes((v) => v.slice(0, -1))}>{en ? "Undo" : "Rückgängig"}</button><button className="sp-tool" type="button" disabled={disabled} onClick={() => { uploadIdRef.current += 1; setUploading(false); setStrokes([]); setPhoto(null); setPhotoReady(true); }}>{en ? "Clear" : "Leeren"}</button></div>{imageError && <p className="sp-caption" role="alert">{en ? "Photo or drawing could not be compressed. Try a smaller image." : "Foto oder Zeichnung konnte nicht klein genug komprimiert werden."}</p>}<canvas ref={canvasRef} className="sp-canvas" width={640} height={480} aria-label={en ? "Drawing canvas" : "Zeichenfläche"} onPointerDown={(e) => { if (disabled) return; e.currentTarget.setPointerCapture(e.pointerId); setDrawing(true); addPoint(e); }} onPointerMove={(e) => { if (drawing) addPoint(e); }} onPointerUp={() => setDrawing(false)} onPointerCancel={() => setDrawing(false)} /><button style={buttonStyle} type="button" disabled={disabled || uploading || (!strokes.length && !photo) || !photoReady} onClick={submitDrawing}>{en ? "Send drawing" : "Zeichnung senden"}</button></>}
    </section>}
    {model.stage === "submit" && model.hasSubmitted && <p className="sp-helper">{en ? "Your answer is in. Stay tuned for the reveal." : "Deine Antwort ist angekommen. Gleich kommt die Auflösung."}</p>}
    {model.stage === "vote" && <section className="sp-results">{model.choices.map((choice, i) => <button className="sp-choice" key={choice.id} type="button" disabled={Boolean(model.disabled || choice.disabled)} aria-pressed={model.selectedId === choice.id} onClick={() => model.onVote(choice.id)} style={{ opacity: choice.disabled ? .55 : 1, animation: `sp-rise .3s ${i * 45}ms both` }}><span>{choice.text || choice.label}</span>{choice.media && <img className="sp-photo" style={{ marginTop: 10 }} src={choice.media} alt={en ? "Player submission" : "Einsendung"} />}</button>)}</section>}
    {(model.stage === "reveal" || model.stage === "finished") && <section className="sp-results">{model.choices.map((choice) => <article className="sp-paper sp-result" key={choice.id}><strong>{choice.authorName ?? (en ? "A player" : "Ein Spieler")}</strong>{choice.text && <span>{choice.text}</span>}{choice.media && <img className="sp-photo" src={choice.media} alt={en ? "Revealed entry" : "Aufgelöste Einsendung"} />}<span className="sp-caption">{en ? `${choice.votes ?? 0} votes` : `${choice.votes ?? 0} Stimmen`}</span></article>)}{model.scores.length > 0 && <div className="sp-paper"><span className="sp-kicker">{en ? "Scoreboard" : "Punktestand"}</span>{model.scores.map((s, i) => <div className="sp-score" key={s.id}><span>{i + 1}. {s.name}</span><strong>{s.score}</strong></div>)}</div>}</section>}
    {model.stage === "waiting" && <p className="sp-helper">{en ? `Waiting for answers · ${model.submittedCount}/${model.playerCount}` : `Warte auf Antworten · ${model.submittedCount}/${model.playerCount}`}</p>}
    {model.ready && <ReadyPanel ready={model.ready} />}
  </main>;
}
