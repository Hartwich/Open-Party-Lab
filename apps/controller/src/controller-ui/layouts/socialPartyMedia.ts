const MAX_FILE_BYTES = 50_000_000;
export const MAX_MEDIA_CHARS = 85_000;

export class SocialPartyMediaError extends Error {
  constructor(public readonly code: "format" | "size" | "decode" | "encode") { super(code); }
}

export function encodePartyCanvas(source: HTMLCanvasElement, maxChars = MAX_MEDIA_CHARS): string {
  for (const maxSide of [640, 512, 384, 256, 192]) {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new SocialPartyMediaError("encode");
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    for (const quality of [.7, .56, .42, .3]) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.startsWith("data:image/jpeg;base64,/9j/") && data.length <= maxChars) return data;
    }
  }
  throw new SocialPartyMediaError("encode");
}

async function decodeImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close(): void }> {
  // Safari and camera-provided HEIC files do not always support ImageBitmap.
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await new Promise<ImageBitmap>((resolve, reject) => {
        let settled = false;
        const timeout = window.setTimeout(() => {
          settled = true; reject(new SocialPartyMediaError("decode"));
        }, 8_000);
        createImageBitmap(file).then((decoded) => {
          // A slow decoder must not keep the picker stuck or leak a late bitmap.
          if (settled) { decoded.close(); return; }
          settled = true; window.clearTimeout(timeout); resolve(decoded);
        }, (error: unknown) => {
          if (settled) return;
          settled = true; window.clearTimeout(timeout); reject(error);
        });
      });
      if (bitmap.width && bitmap.height) return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
      bitmap.close();
    } catch { /* Try the browser's regular image decoder below. */ }
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        window.clearTimeout(timer); image.onload = null; image.onerror = null;
        if (error) reject(error); else resolve();
      };
      const timer = window.setTimeout(() => finish(new SocialPartyMediaError("decode")), 25_000);
      image.onload = () => image.naturalWidth && image.naturalHeight ? finish() : finish(new SocialPartyMediaError("decode"));
      image.onerror = () => finish(new SocialPartyMediaError("decode"));
      image.src = url;
    });
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}

export async function compressPartyImage(file: File, maxChars = MAX_MEDIA_CHARS): Promise<string> {
  // Some phone cameras return no MIME type. Decoding still verifies the file.
  if (file.type && !file.type.toLowerCase().startsWith("image/")) throw new SocialPartyMediaError("format");
  if (!file.size) throw new SocialPartyMediaError("decode");
  if (file.size > MAX_FILE_BYTES) throw new SocialPartyMediaError("size");
  const image = await decodeImage(file);
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new SocialPartyMediaError("encode");
    ctx.fillStyle = "#fffdf8"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image.source, 0, 0, canvas.width, canvas.height);
    return encodePartyCanvas(canvas, maxChars);
  } finally { image.close(); }
}
