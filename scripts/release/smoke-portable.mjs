import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import { io } from "socket.io-client";

const root = path.resolve(process.argv[2]);
const manifest = JSON.parse(await readFile(path.join(root, "release.json"), "utf8"));
if (manifest.launcher?.hotspot) {
  for (const helper of ["hotspot.ps1", "wifi-qr.mjs", ...(manifest.launcher.offlineHotspot ? ["offline-hotspot.ps1"] : [])]) {
    assert((await readFile(path.join(root, helper))).length > 0, `Missing hotspot helper ${helper}`);
  }
}
const probe = createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "open-party-portable-"));
// Moving only cwd does not isolate ESM imports: they resolve relative to the JS file.
// Copy the release away from the checkout so it cannot fall back to development node_modules.
const isolatedRoot = path.join(temporaryDirectory, "portable");
await cp(root, isolatedRoot, { recursive: true });
if (manifest.launcher?.hotspot) {
  for (const [args, values] of [
    [[], ["Portable Wi-Fi", "PortableTest2026"]],
    [["--controller"], [`${origin}/controller/#join?room=LAB2`, ""]]
  ]) {
    const qr = spawnSync(path.join(isolatedRoot, "runtime/node.exe"), [path.join(isolatedRoot, "wifi-qr.mjs"), ...args], {
      input: values.map(value => Buffer.from(value).toString("base64")).join("\n") + "\n",
      env: { ...process.env, NODE_PATH: "", NODE_OPTIONS: "" }, windowsHide: true
    });
    assert.equal(qr.status, 0, qr.stderr?.toString());
    assert.equal(qr.stdout.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "QR helper must produce a PNG");
  }
}
const server = spawn(path.join(isolatedRoot, "runtime/node.exe"), [path.join(isolatedRoot, "app/server/main.js")], {
  cwd: temporaryDirectory, windowsHide: true,
  env: {
    ...process.env, NODE_PATH: "", NODE_OPTIONS: "", NODE_ENV: "production",
    HOST: "127.0.0.1", PORT: String(port), RENDER: "false", RENDER_EXTERNAL_URL: "",
    PRIMARY_ROOM_CODE: "LAB2",
    OPEN_PARTY_LAB_WEB_ROOT: path.join(isolatedRoot, "app/web"),
    PUBLIC_CONTROLLER_ORIGIN: `${origin}/controller/`
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let output = "";
let spawnError;
server.on("error", (error) => { spawnError = error; });
server.stdout.on("data", (chunk) => { output += chunk; });
server.stderr.on("data", (chunk) => { output += chunk; });
let socket;
let controller;
let reopenedHost;
try {
  let healthy = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (spawnError) throw spawnError;
    if (server.exitCode !== null) throw new Error(output);
    try {
      const response = await fetch(`${origin}/health`, { signal: AbortSignal.timeout(500) });
      healthy = response.ok && (await response.json()).port === port;
    } catch { /* Wait for the bundled server to listen. */ }
    if (healthy) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert(healthy, `Bundled server did not start.\n${output}`);
  for (const surface of ["/", "/controller/"]) {
    const response = await fetch(`${origin}${surface}`);
    assert.match(response.headers.get("content-type"), /text\/html/);
    const html = await response.text();
    assert.match(html, /<html/);
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)];
    assert(assets.length > 0, `${surface} has no bundled assets`);
    for (const [, asset] of assets) {
      const assetResponse = await fetch(new URL(asset, `${origin}${surface}`));
      assert(assetResponse.ok, `Missing asset ${asset}`);
      assert.match(assetResponse.headers.get("content-type"), asset.endsWith(".js") ? /javascript/ : /text\/css/);
    }
  }
  socket = io(origin, { transports: ["websocket"], reconnection: false, autoConnect: false, timeout: 5000 });
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
    socket.connect();
  });
  const created = await socket.timeout(5000).emitWithAck("room:create", { hostName: "Portable check", language: "de", roomCode: "LAB2" });
  assert(created.ok, JSON.stringify(created));
  const room = created.data.room;
  assert.equal(room.code, "LAB2", "Requested primary room must be created on first open");
  assert.equal(room.expiresAt, null, "Local portable rooms must not have a lifetime limit");
  const games = new Set(room.availableGames.map((game) => game.id));
  for (const id of manifest.games) assert(games.has(id), `Portable catalog is missing ${id}`);
  assert(room.joinUrl.startsWith(`${origin}/controller`), `Unexpected join URL: ${room.joinUrl}`);
  async function connectPeer() {
    const peer = io(origin, { transports: ["websocket"], reconnection: false, autoConnect: false, timeout: 5000 });
    try {
      await new Promise((resolve, reject) => { peer.once("connect", resolve); peer.once("connect_error", reject); peer.connect(); });
      return peer;
    } catch (error) { peer.disconnect(); throw error; }
  }
  controller = await connectPeer();
  const joined = await controller.timeout(5000).emitWithAck("room:join", { roomCode: "LAB2", playerName: "Portable player", deviceId: "portable-room-reuse" });
  assert(joined.ok, JSON.stringify(joined));
  reopenedHost = await connectPeer();
  const resumed = await reopenedHost.timeout(5000).emitWithAck("room:create", { roomCode: "LAB2", hostName: "Reopened host" });
  assert(resumed.ok, JSON.stringify(resumed));
  assert.equal(resumed.data.room.code, room.code);
  assert.equal(resumed.data.room.createdAt, room.createdAt);
  assert(resumed.data.room.players.some(player => player.name === "Portable player"), "Reopening host must preserve players");
  const unknown = await reopenedHost.timeout(5000).emitWithAck("room:create", { roomCode: "ZZZZ" });
  assert.equal(unknown.ok, false, "An unknown non-primary room must not be created implicitly");
  console.log(`Portable smoke passed: bundled Node, assets, fixed room creation/reopening with players, unlimited lifetime and ${manifest.games.length} external games.`);
} finally {
  socket?.disconnect();
  controller?.disconnect();
  reopenedHost?.disconnect();
  if (server.exitCode === null && !spawnError) {
    const exited = once(server, "exit");
    server.kill();
    await exited;
  }
  const relativeTemporaryPath = path.relative(path.resolve(tmpdir()), temporaryDirectory);
  assert(relativeTemporaryPath.startsWith("open-party-portable-") && !relativeTemporaryPath.includes(path.sep));
  await rm(temporaryDirectory, { recursive: true, force: true });
}
