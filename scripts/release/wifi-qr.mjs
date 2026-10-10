import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

export function wifiPayload(name, password) {
  const escape = (value) => value.replace(/[\\;,:\"]/g, "\\$&");
  return `WIFI:T:WPA;S:${escape(name)};P:${escape(password)};;`;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const lines = Buffer.concat(chunks).toString("utf8").trim().split(/\r?\n/);
    const name = Buffer.from(lines[0], "base64").toString("utf8");
    const password = Buffer.from(lines[1] ?? "", "base64").toString("utf8");
    const controllerMode = process.argv.includes("--controller");
    if (controllerMode) {
      const url = new URL(name);
      if (url.protocol !== "http:" || url.pathname !== "/controller/" || !/^#join\?room=[A-Z0-9]{4}$/.test(url.hash)) throw new Error("Invalid controller URL.");
    } else if (!name || Buffer.byteLength(name) > 32 || !/^[\x20-\x7e]{8,63}$/.test(password)) throw new Error("Invalid Wi-Fi settings.");
    const require = createRequire(new URL("./app/package.json", import.meta.url));
    const qr = require("qrcode");
    const png = await qr.toBuffer(controllerMode ? name : wifiPayload(name, password), { type: "png", errorCorrectionLevel: "M", scale: 8, margin: 4 });
    process.stdout.write(png);
  } catch {
    process.stderr.write("The QR code could not be generated. Check the complete portable package and network settings.\n");
    process.exitCode = 1;
  }
}
