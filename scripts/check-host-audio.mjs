import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Exercise the platform hook without a speaker or autoplay permission. Live
// browser signal measurements complement this connection-contract regression.
class Param {
  value = 1;
  cancelScheduledValues() {}
  setTargetAtTime(value) { this.value = value; }
}

class Node {
  connections = [];
  constructor(context) { this.context = context; }
  connect(destination, ...ports) {
    assert.ok(destination instanceof Node || destination instanceof Param);
    if (destination instanceof Param) assert.ok(ports.length <= 1);
    this.connections.push({ destination, ports });
    return destination instanceof Param ? undefined : destination;
  }
}

class Context {
  state = "running";
  currentTime = 0;
  destination = new Node(this);
  gains = [];
  listeners = new Map();
  createGain() {
    const gain = new Node(this); gain.gain = new Param();
    this.gains.push(gain); return gain;
  }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  close() { this.state = "closed"; this.listeners.get("statechange")?.(); }
}

class OfflineContext extends Context {}
const stored = new Map();
globalThis.AudioNode = Node;
globalThis.OfflineAudioContext = OfflineContext;
globalThis.window = { localStorage: {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value)
} };
const source = await readFile(new URL("../apps/host/src/app/audioVolume.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const audio = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
assert.equal(audio.readHostSoundEffectsVolume(), 1);
audio.installHostSoundEffectsVolume();
const installed = Node.prototype.connect;
audio.installHostSoundEffectsVolume();
assert.equal(Node.prototype.connect, installed);

const game = new Context(); const effect = new Node(game);
assert.equal(effect.connect(game.destination), game.destination);
const [bus] = game.gains;
assert.equal(effect.connections[0].destination, bus);
assert.equal(bus.connections.length, 1);
assert.equal(bus.connections[0].destination, game.destination);
assert.notEqual(bus.connections[0].destination, bus);
assert.equal(bus.gain.value, 1);
new Node(game).connect(game.destination, 0, 0);
assert.equal(game.gains.length, 1);
assert.deepEqual(bus.connections[0].ports, []);

const internal = new Node(game); const parameter = new Param();
assert.equal(internal.connect(parameter), undefined);
assert.deepEqual(internal.connections[0].ports, []);
assert.equal(internal.connect(parameter, 0), undefined);
assert.deepEqual(internal.connections[1].ports, [0]);
const other = new Node(game);
assert.equal(internal.connect(other, 1, 0), other);
assert.deepEqual(internal.connections[2].ports, [1, 0]);

audio.setHostSoundEffectsVolume(0);
assert.equal(bus.gain.value, 0);
assert.equal(audio.readHostSoundEffectsVolume(), 0);
const anotherGame = new Context(); new Node(anotherGame).connect(anotherGame.destination);
assert.equal(anotherGame.gains[0].gain.value, 0);
audio.setHostSoundEffectsVolume(.4);
assert.equal(bus.gain.value, .4);
assert.equal(anotherGame.gains[0].gain.value, .4);
assert.equal(audio.readHostSoundEffectsVolume(), .4);

const music = new Context(); audio.markHostMusicAudioContext(music);
const musicSource = new Node(music);
assert.equal(musicSource.connect(music.destination), music.destination);
assert.equal(music.gains.length, 0);
const offline = new OfflineContext(); const offlineSource = new Node(offline);
assert.equal(offlineSource.connect(offline.destination), offline.destination);
assert.equal(offline.gains.length, 0);
game.close(); audio.setHostSoundEffectsVolume(.8);
assert.equal(bus.gain.value, .4);
assert.equal(anotherGame.gains[0].gain.value, .8);
console.log("Host audio routing passed: native output, shared bus, chaining, AudioParam ports, volume persistence, music/offline isolation, and closed-context cleanup.");
