import type {
  ChaosKommandoExplosionSourceId,
  ChaosKommandoState,
  ChaosKommandoWeaponId
} from "@open-party-lab/protocol";

const AUDIO_UNLOCK_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

type UnlockEventName = (typeof AUDIO_UNLOCK_EVENTS)[number];

function resolveAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const extendedWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? extendedWindow.webkitAudioContext ?? null;
}

interface ChargeNodes {
  carrier: OscillatorNode;
  shimmer: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
}

export class ChaosKommandoAudioRig {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private chargeNodes: ChargeNodes | null = null;
  private removeUnlockListeners: Array<() => void> = [];
  private knownProjectileIds = new Set<string>();
  private knownExplosionIds = new Set<string>();

  constructor() {
    this.bindUnlockListeners();
  }

  destroy(): void {
    this.removeUnlockListeners.forEach((remove) => remove());
    this.removeUnlockListeners = [];
    this.stopChargeLoop();
    this.knownProjectileIds.clear();
    this.knownExplosionIds.clear();

    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
      this.noiseBuffer = null;
    }
  }

  syncState(previousState: ChaosKommandoState | null, nextState: ChaosKommandoState | null): void {
    if (!nextState) {
      this.stopChargeLoop();
      this.knownProjectileIds.clear();
      this.knownExplosionIds.clear();
      return;
    }

    const previousProjectileIds =
      previousState?.projectiles.map((projectile) => projectile.id) ?? Array.from(this.knownProjectileIds);
    const previousExplosionIds =
      previousState?.explosions.map((explosion) => explosion.id) ?? Array.from(this.knownExplosionIds);
    const previousProjectileSet = new Set(previousProjectileIds);
    const previousExplosionSet = new Set(previousExplosionIds);

    for (const projectile of nextState.projectiles) {
      if (!previousProjectileSet.has(projectile.id)) {
        this.playShot(projectile.weaponId);
      }
    }

    for (const explosion of nextState.explosions) {
      if (!previousExplosionSet.has(explosion.id)) {
        this.playExplosion(explosion.sourceWeaponId);
      }
    }

    this.knownProjectileIds = new Set(nextState.projectiles.map((projectile) => projectile.id));
    this.knownExplosionIds = new Set(nextState.explosions.map((explosion) => explosion.id));
    this.updateChargeLoop(nextState);
  }

  updateChargeLoop(state: ChaosKommandoState | null): void {
    if (!state) {
      this.stopChargeLoop();
      return;
    }

    const currentWeapon = state.weapons.find((weapon) => weapon.id === state.turn.currentWeaponId) ?? null;
    const shouldCharge =
      currentWeapon?.fireMode === "charged" &&
      !state.turn.hasFired &&
      !state.turn.resolvingShot &&
      state.turn.chargeRatio > 0.01;

    if (!shouldCharge) {
      this.stopChargeLoop();
      return;
    }

    const context = this.ensureAudioContext();

    if (!context || !this.masterGain) {
      return;
    }

    void context.resume().catch(() => undefined);

    if (!this.chargeNodes) {
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1_600, context.currentTime);
      const carrier = context.createOscillator();
      carrier.type = "triangle";
      carrier.frequency.setValueAtTime(160, context.currentTime);
      const shimmer = context.createOscillator();
      shimmer.type = "sine";
      shimmer.frequency.setValueAtTime(320, context.currentTime);
      carrier.connect(filter);
      shimmer.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      carrier.start();
      shimmer.start();
      this.chargeNodes = { carrier, shimmer, gain, filter };
    }

    const ratio = Math.max(0, Math.min(1, state.turn.chargeRatio));
    const now = context.currentTime;

    this.chargeNodes.carrier.frequency.setTargetAtTime(150 + ratio * 260, now, 0.04);
    this.chargeNodes.shimmer.frequency.setTargetAtTime(300 + ratio * 520, now, 0.04);
    this.chargeNodes.filter.frequency.setTargetAtTime(1_200 + ratio * 2_800, now, 0.05);
    this.chargeNodes.gain.gain.setTargetAtTime(0.012 + ratio * 0.05, now, 0.03);
  }

  private stopChargeLoop(): void {
    if (!this.chargeNodes || !this.audioContext) {
      this.chargeNodes = null;
      return;
    }

    const now = this.audioContext.currentTime;
    this.chargeNodes.gain.gain.cancelScheduledValues(now);
    this.chargeNodes.gain.gain.setTargetAtTime(0.0001, now, 0.04);
    this.chargeNodes.carrier.stop(now + 0.14);
    this.chargeNodes.shimmer.stop(now + 0.14);
    this.chargeNodes.carrier.disconnect();
    this.chargeNodes.shimmer.disconnect();
    this.chargeNodes.filter.disconnect();
    this.chargeNodes.gain.disconnect();
    this.chargeNodes = null;
  }

  private playShot(weaponId: ChaosKommandoWeaponId): void {
    switch (weaponId) {
      case "kicher-bazooka":
        this.playTone("sawtooth", 210, 74, 0.28, 0.12);
        this.playTone("triangle", 440, 180, 0.18, 0.05);
        break;
      case "enten-granate":
        this.playTone("triangle", 640, 220, 0.16, 0.08);
        this.playNoiseBurst(0.05, 0.04, 4_200, 1_900);
        break;
      case "plunder-pistole":
        this.playTone("square", 880, 250, 0.08, 0.08);
        this.playNoiseBurst(0.03, 0.025, 5_400, 2_400);
        break;
      case "regenbogen-rakete":
        this.playTone("triangle", 260, 620, 0.24, 0.09);
        this.playTone("sine", 510, 920, 0.18, 0.04);
        break;
      case "splitter-granate":
        this.playTone("triangle", 520, 180, 0.2, 0.08);
        this.playNoiseBurst(0.06, 0.035, 4_800, 1_700);
        break;
      case "konfetti-schrot":
        this.playNoiseBurst(0.09, 0.055, 6_200, 2_200);
        this.playTone("square", 1_020, 520, 0.08, 0.045);
        break;
      case "bohrer-rakete":
        this.playTone("sawtooth", 170, 88, 0.28, 0.09);
        this.playNoiseBurst(0.08, 0.04, 2_200, 540);
        break;
      case "gummi-huhn":
        this.playTone("sine", 780, 1_120, 0.16, 0.07);
        this.playTone("triangle", 440, 300, 0.2, 0.04);
        break;
      case "seifenblasen-bombe":
        this.playTone("sine", 390, 720, 0.28, 0.045);
        this.playTone("triangle", 760, 1_040, 0.18, 0.025);
        break;
      case "keks-moerser":
        this.playTone("triangle", 180, 92, 0.24, 0.08);
        this.playNoiseBurst(0.05, 0.03, 1_700, 500);
        break;
    }
  }

  private playExplosion(sourceWeaponId: ChaosKommandoExplosionSourceId): void {
    switch (sourceWeaponId) {
      case "kicher-bazooka":
        this.playNoiseBurst(0.42, 0.22, 900, 160);
        this.playTone("sawtooth", 110, 34, 0.32, 0.1);
        break;
      case "enten-granate":
        this.playNoiseBurst(0.48, 0.25, 1_050, 120);
        this.playTone("triangle", 170, 46, 0.36, 0.11);
        break;
      case "plunder-pistole":
        this.playNoiseBurst(0.12, 0.08, 2_400, 800);
        this.playTone("square", 240, 78, 0.12, 0.04);
        break;
      case "regenbogen-rakete":
        this.playNoiseBurst(0.4, 0.22, 1_600, 220);
        this.playTone("triangle", 160, 56, 0.28, 0.08);
        this.playTone("sine", 780, 320, 0.22, 0.04);
        break;
      case "splitter-granate":
        this.playNoiseBurst(0.36, 0.2, 2_800, 180);
        this.playTone("square", 230, 62, 0.24, 0.08);
        this.playTone("triangle", 940, 420, 0.12, 0.04);
        break;
      case "konfetti-schrot":
        this.playNoiseBurst(0.1, 0.07, 4_800, 1_200);
        this.playTone("triangle", 900, 380, 0.1, 0.04);
        break;
      case "bohrer-rakete":
        this.playNoiseBurst(0.38, 0.21, 1_300, 110);
        this.playTone("sawtooth", 130, 36, 0.32, 0.1);
        break;
      case "gummi-huhn":
        this.playNoiseBurst(0.28, 0.15, 1_600, 260);
        this.playTone("sine", 720, 220, 0.24, 0.06);
        break;
      case "seifenblasen-bombe":
        this.playNoiseBurst(0.22, 0.11, 2_400, 520);
        this.playTone("sine", 520, 120, 0.3, 0.055);
        break;
      case "keks-moerser":
        this.playNoiseBurst(0.44, 0.23, 920, 130);
        this.playTone("triangle", 120, 44, 0.34, 0.095);
        break;
      case "abschieds-bumm":
        this.playNoiseBurst(0.32, 0.16, 1_100, 180);
        this.playTone("square", 180, 64, 0.22, 0.07);
        break;
    }
  }

  private playTone(
    wave: OscillatorType,
    frequencyStart: number,
    frequencyEnd: number,
    durationSeconds: number,
    gainValue: number
  ): void {
    const context = this.ensureAudioContext();

    if (!context || !this.masterGain) {
      return;
    }

    void context.resume().catch(() => undefined);

    const oscillator = context.createOscillator();
    oscillator.type = wave;
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.max(800, frequencyStart * 8), context.currentTime);
    oscillator.frequency.setValueAtTime(frequencyStart, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequencyEnd), context.currentTime + durationSeconds);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationSeconds);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + durationSeconds + 0.05);
  }

  private playNoiseBurst(
    durationSeconds: number,
    gainValue: number,
    filterStartHz: number,
    filterEndHz: number
  ): void {
    const context = this.ensureAudioContext();

    if (!context || !this.masterGain) {
      return;
    }

    void context.resume().catch(() => undefined);

    const source = context.createBufferSource();
    source.buffer = this.getNoiseBuffer(context);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterStartHz, context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, filterEndHz), context.currentTime + durationSeconds);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationSeconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(context.currentTime);
    source.stop(context.currentTime + durationSeconds + 0.04);
  }

  private getNoiseBuffer(context: AudioContext): AudioBuffer {
    if (this.noiseBuffer) {
      return this.noiseBuffer;
    }

    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, sampleRate, sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    this.noiseBuffer = buffer;
    return buffer;
  }

  private ensureAudioContext(): AudioContext | null {
    if (this.audioContext && this.masterGain) {
      return this.audioContext;
    }

    const AudioContextCtor = resolveAudioContextCtor();

    if (!AudioContextCtor) {
      return null;
    }

    this.audioContext = new AudioContextCtor();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.22;
    this.masterGain.connect(this.audioContext.destination);
    return this.audioContext;
  }

  private bindUnlockListeners(): void {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    for (const eventName of AUDIO_UNLOCK_EVENTS) {
      const handler = () => {
        const context = this.ensureAudioContext();
        if (!context) {
          return;
        }

        void context.resume().catch(() => undefined);
      };

      document.addEventListener(eventName, handler, { passive: true });
      this.removeUnlockListeners.push(() => {
        document.removeEventListener(eventName, handler);
      });
    }
  }
}
