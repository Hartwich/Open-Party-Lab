const soundEffectsPreferenceKey = "open-party-lab.host-sound-effects-volume";
const DEFAULT_SOUND_EFFECTS_VOLUME = 1;

type ConnectFunction = AudioNode["connect"];

const musicContexts = new WeakSet<BaseAudioContext>();
const soundEffectBuses = new Set<{ context: BaseAudioContext; gain: GainNode }>();
let originalConnect: ConnectFunction | null = null;

function clampVolume(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : DEFAULT_SOUND_EFFECTS_VOLUME;
}

export function readHostSoundEffectsVolume(): number {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return DEFAULT_SOUND_EFFECTS_VOLUME;
  }

  const stored = window.localStorage.getItem(soundEffectsPreferenceKey);
  return stored === null ? DEFAULT_SOUND_EFFECTS_VOLUME : clampVolume(Number(stored));
}

/** Mark the platform music context so the effects output gain does not affect it. */
export function markHostMusicAudioContext(context: BaseAudioContext): void {
  musicContexts.add(context);
}

/**
 * Route game Web Audio outputs through one adjustable host effects bus.
 * The hook only changes connections made directly to an AudioContext's output;
 * audio graphs inside each game remain untouched.
 */
export function installHostSoundEffectsVolume(): void {
  if (typeof AudioNode === "undefined" || originalConnect) return;

  originalConnect = AudioNode.prototype.connect;
  const connect = originalConnect;

  const patchedConnect = function (this: AudioNode, destination: AudioNode | AudioParam, output?: number, input?: number): AudioNode {
    const context = this.context;
    if (
      destination !== context.destination ||
      musicContexts.has(context) ||
      typeof OfflineAudioContext !== "undefined" && context instanceof OfflineAudioContext
    ) {
      return Reflect.apply(connect, this, [destination, output, input]) as AudioNode;
    }

    let bus: GainNode | undefined;
    for (const candidate of soundEffectBuses) {
      if (candidate.context === context) {
        bus = candidate.gain;
        break;
      }
    }
    if (!bus) {
      bus = context.createGain();
      bus.gain.value = readHostSoundEffectsVolume();
      soundEffectBuses.add({ context, gain: bus });
      bus.connect(context.destination);
      context.addEventListener("statechange", () => {
        if (context.state === "closed") {
          for (const candidate of soundEffectBuses) {
            if (candidate.context === context) soundEffectBuses.delete(candidate);
          }
        }
      });
    }

    Reflect.apply(connect, this, [bus, output]);
    return bus;
  };
  AudioNode.prototype.connect = patchedConnect as unknown as ConnectFunction;
}

/** Applies a new effects level immediately and remembers it for this host. */
export function setHostSoundEffectsVolume(value: number): number {
  const volume = clampVolume(value);
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    window.localStorage.setItem(soundEffectsPreferenceKey, String(volume));
  }

  for (const bus of soundEffectBuses) {
    if (bus.context.state === "closed") {
      soundEffectBuses.delete(bus);
      continue;
    }
    const now = bus.context.currentTime;
    bus.gain.gain.cancelScheduledValues(now);
    bus.gain.gain.setTargetAtTime(volume, now, 0.02);
  }
  return volume;
}
