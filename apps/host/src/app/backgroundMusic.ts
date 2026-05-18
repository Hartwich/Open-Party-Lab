import type { HostAppState, HostSocketClient } from "./hostSocketClient.js";

const LOBBY_TRACK_ID = "lobby";
const LOOKUP_DEFAULT_TRACK_ID = "default";
const MUSIC_UNLOCK_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

interface MusicTemplate {
  leadPattern: Array<number | null>;
  bassPattern: Array<number | null>;
  padPattern: Array<number | null>;
  barProgression: number[];
  kickPattern: number[];
  snarePattern: number[];
  hatPattern: number[];
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  padWave: OscillatorType;
  padChordIntervals: number[];
  leadGain: number;
  bassGain: number;
  padGain: number;
  drumGain: number;
  lowpassHz: number;
}

interface MusicProfile extends MusicTemplate {
  bpm: number;
  rootMidi: number;
  masterGain: number;
}

function createProfile(
  template: MusicTemplate,
  overrides: Partial<Pick<MusicProfile, "bpm" | "rootMidi" | "masterGain">>
): MusicProfile {
  return {
    ...template,
    bpm: overrides.bpm ?? 110,
    rootMidi: overrides.rootMidi ?? 52,
    masterGain: overrides.masterGain ?? 0.16
  };
}

const musicTemplates: Record<string, MusicTemplate> = {
  lobby: {
    leadPattern: [0, null, 7, null, 3, null, 10, null, 7, null, 12, null, 10, null, 7, null],
    bassPattern: [0, null, null, null, -5, null, null, null, -2, null, null, null, -5, null, null, null],
    padPattern: [0, null, 3, null],
    barProgression: [0, -5, -2, 3],
    kickPattern: [1, 0, 0, 0, 0.7, 0, 0, 0, 1, 0, 0, 0, 0.7, 0, 0, 0],
    snarePattern: [0, 0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 0, 0, 0, 0.7, 0],
    hatPattern: [0.24, 0, 0.18, 0, 0.22, 0, 0.18, 0, 0.24, 0, 0.18, 0, 0.22, 0, 0.18, 0],
    leadWave: "triangle",
    bassWave: "sine",
    padWave: "triangle",
    padChordIntervals: [0, 7, 12],
    leadGain: 0.075,
    bassGain: 0.1,
    padGain: 0.08,
    drumGain: 0.16,
    lowpassHz: 2_200
  },
  battle: {
    leadPattern: [0, null, 3, null, 7, null, 10, null, 12, null, 10, null, 7, 5, 3, null],
    bassPattern: [0, null, 0, null, -5, null, -5, null, -2, null, -2, null, -5, null, -5, null],
    padPattern: [0, null, -2, null],
    barProgression: [0, -5, -2, -7],
    kickPattern: [1, 0, 0.45, 0, 0.8, 0, 0.32, 0, 1, 0, 0.45, 0, 0.8, 0, 0.32, 0],
    snarePattern: [0, 0, 0, 0.12, 0, 0, 0.7, 0, 0, 0, 0, 0.12, 0, 0, 0.78, 0],
    hatPattern: [0.18, 0.14, 0.18, 0.14, 0.2, 0.14, 0.18, 0.14, 0.18, 0.14, 0.18, 0.14, 0.2, 0.14, 0.18, 0.14],
    leadWave: "square",
    bassWave: "sawtooth",
    padWave: "triangle",
    padChordIntervals: [0, 7, 10],
    leadGain: 0.07,
    bassGain: 0.12,
    padGain: 0.065,
    drumGain: 0.18,
    lowpassHz: 2_400
  },
  chase: {
    leadPattern: [0, 3, 7, 10, 12, 10, 7, 3, 0, 3, 7, 10, 12, 15, 10, 7],
    bassPattern: [0, null, -5, null, 0, null, -2, null, 0, null, -5, null, 0, null, -2, null],
    padPattern: [0, null, 7, null],
    barProgression: [0, -2, -5, -2],
    kickPattern: [1, 0, 0.5, 0, 0.85, 0.3, 0.42, 0, 1, 0, 0.5, 0, 0.85, 0.3, 0.42, 0],
    snarePattern: [0, 0, 0, 0.1, 0, 0, 0.76, 0, 0, 0, 0, 0.1, 0, 0, 0.76, 0],
    hatPattern: [0.22, 0.18, 0.22, 0.18, 0.22, 0.18, 0.22, 0.18, 0.22, 0.18, 0.22, 0.18, 0.22, 0.18, 0.22, 0.18],
    leadWave: "square",
    bassWave: "triangle",
    padWave: "sine",
    padChordIntervals: [0, 5, 12],
    leadGain: 0.075,
    bassGain: 0.115,
    padGain: 0.05,
    drumGain: 0.18,
    lowpassHz: 2_800
  },
  arcade: {
    leadPattern: [0, null, 7, 12, 7, null, 10, 7, 0, null, 5, 7, 10, 7, 5, null],
    bassPattern: [0, null, null, 0, -5, null, null, -5, -2, null, null, -2, -5, null, null, -5],
    padPattern: [0, 7, 5, 7],
    barProgression: [0, -5, -2, 0],
    kickPattern: [1, 0, 0.35, 0, 0.8, 0, 0.35, 0, 1, 0, 0.35, 0, 0.8, 0, 0.35, 0],
    snarePattern: [0, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 0, 0, 0, 0.8, 0],
    hatPattern: [0.24, 0.1, 0.2, 0.1, 0.24, 0.1, 0.2, 0.1, 0.24, 0.1, 0.2, 0.1, 0.24, 0.1, 0.2, 0.1],
    leadWave: "triangle",
    bassWave: "square",
    padWave: "triangle",
    padChordIntervals: [0, 7, 12],
    leadGain: 0.08,
    bassGain: 0.11,
    padGain: 0.05,
    drumGain: 0.18,
    lowpassHz: 3_000
  },
  mystery: {
    leadPattern: [0, null, null, 7, null, null, 3, null, -2, null, null, 5, null, null, 3, null],
    bassPattern: [0, null, null, null, -7, null, null, null, -5, null, null, null, -7, null, null, null],
    padPattern: [0, null, -5, null],
    barProgression: [0, -7, -5, -2],
    kickPattern: [0.75, 0, 0, 0, 0.45, 0, 0, 0, 0.75, 0, 0, 0, 0.45, 0, 0, 0],
    snarePattern: [0, 0, 0, 0.08, 0, 0, 0.5, 0, 0, 0, 0, 0.08, 0, 0, 0.55, 0],
    hatPattern: [0.1, 0, 0.08, 0, 0.1, 0, 0.08, 0, 0.1, 0, 0.08, 0, 0.1, 0, 0.08, 0],
    leadWave: "sine",
    bassWave: "triangle",
    padWave: "triangle",
    padChordIntervals: [0, 6, 12],
    leadGain: 0.06,
    bassGain: 0.095,
    padGain: 0.085,
    drumGain: 0.12,
    lowpassHz: 1_800
  },
  gentle: {
    leadPattern: [0, null, 5, null, 7, null, 9, null, 12, null, 9, null, 7, null, 5, null],
    bassPattern: [0, null, null, null, -5, null, null, null, 0, null, null, null, -2, null, null, null],
    padPattern: [0, null, 5, null],
    barProgression: [0, -5, 0, -2],
    kickPattern: [0.55, 0, 0, 0, 0.4, 0, 0, 0, 0.55, 0, 0, 0, 0.4, 0, 0, 0],
    snarePattern: [0, 0, 0, 0.06, 0, 0, 0.35, 0, 0, 0, 0, 0.06, 0, 0, 0.35, 0],
    hatPattern: [0.08, 0, 0.06, 0, 0.08, 0, 0.06, 0, 0.08, 0, 0.06, 0, 0.08, 0, 0.06, 0],
    leadWave: "sine",
    bassWave: "sine",
    padWave: "triangle",
    padChordIntervals: [0, 7, 12],
    leadGain: 0.055,
    bassGain: 0.08,
    padGain: 0.085,
    drumGain: 0.1,
    lowpassHz: 2_000
  },
  sports: {
    leadPattern: [0, 7, null, 10, 12, 10, null, 7, 0, 7, null, 10, 12, 15, 12, 10],
    bassPattern: [0, null, 0, null, -5, null, -5, null, 0, null, 0, null, -2, null, -2, null],
    padPattern: [0, 7, 5, 10],
    barProgression: [0, -5, 0, -2],
    kickPattern: [1, 0, 0.3, 0, 0.9, 0, 0.3, 0, 1, 0, 0.3, 0, 0.9, 0, 0.3, 0],
    snarePattern: [0, 0, 0, 0, 0, 0, 0.82, 0, 0, 0, 0, 0, 0, 0, 0.82, 0],
    hatPattern: [0.22, 0.14, 0.22, 0.14, 0.22, 0.14, 0.22, 0.14, 0.22, 0.14, 0.22, 0.14, 0.22, 0.14, 0.22, 0.14],
    leadWave: "square",
    bassWave: "sawtooth",
    padWave: "triangle",
    padChordIntervals: [0, 7, 12],
    leadGain: 0.08,
    bassGain: 0.12,
    padGain: 0.055,
    drumGain: 0.19,
    lowpassHz: 3_100
  },
  kitchen: {
    leadPattern: [0, null, 4, null, 7, null, 9, null, 12, null, 9, null, 7, null, 4, null],
    bassPattern: [0, null, null, 0, -5, null, null, -5, 0, null, null, 0, -2, null, null, -2],
    padPattern: [0, null, 7, null],
    barProgression: [0, -5, 0, -2],
    kickPattern: [0.9, 0, 0.28, 0, 0.72, 0, 0.28, 0, 0.9, 0, 0.28, 0, 0.72, 0, 0.28, 0],
    snarePattern: [0, 0, 0, 0, 0, 0, 0.72, 0, 0, 0, 0, 0, 0, 0, 0.72, 0],
    hatPattern: [0.18, 0.08, 0.2, 0.08, 0.18, 0.08, 0.2, 0.08, 0.18, 0.08, 0.2, 0.08, 0.18, 0.08, 0.2, 0.08],
    leadWave: "triangle",
    bassWave: "triangle",
    padWave: "sine",
    padChordIntervals: [0, 7, 12],
    leadGain: 0.07,
    bassGain: 0.1,
    padGain: 0.055,
    drumGain: 0.16,
    lowpassHz: 2_700
  },
  western: {
    leadPattern: [0, null, 7, null, 10, null, 7, null, 0, null, 5, null, 7, null, 3, null],
    bassPattern: [0, null, 0, null, -5, null, -5, null, -2, null, -2, null, -5, null, -5, null],
    padPattern: [0, null, -2, null],
    barProgression: [0, -5, -2, -5],
    kickPattern: [0.85, 0, 0.22, 0, 0.7, 0, 0.22, 0, 0.85, 0, 0.22, 0, 0.7, 0, 0.22, 0],
    snarePattern: [0, 0, 0, 0, 0, 0, 0.65, 0, 0, 0, 0, 0, 0, 0, 0.65, 0],
    hatPattern: [0.12, 0, 0.1, 0, 0.12, 0, 0.1, 0, 0.12, 0, 0.1, 0, 0.12, 0, 0.1, 0],
    leadWave: "triangle",
    bassWave: "sine",
    padWave: "triangle",
    padChordIntervals: [0, 7, 12],
    leadGain: 0.07,
    bassGain: 0.1,
    padGain: 0.055,
    drumGain: 0.14,
    lowpassHz: 2_100
  },
  strategy: {
    leadPattern: [0, null, 3, null, 7, null, 12, null, 10, null, 7, null, 5, null, 3, null],
    bassPattern: [0, null, null, null, -5, null, null, null, -2, null, null, null, -5, null, null, null],
    padPattern: [0, null, -2, null],
    barProgression: [0, -5, -2, -5],
    kickPattern: [0.72, 0, 0.16, 0, 0.6, 0, 0.16, 0, 0.72, 0, 0.16, 0, 0.6, 0, 0.16, 0],
    snarePattern: [0, 0, 0, 0.05, 0, 0, 0.48, 0, 0, 0, 0, 0.05, 0, 0, 0.48, 0],
    hatPattern: [0.1, 0, 0.08, 0, 0.1, 0, 0.08, 0, 0.1, 0, 0.08, 0, 0.1, 0, 0.08, 0],
    leadWave: "triangle",
    bassWave: "triangle",
    padWave: "sine",
    padChordIntervals: [0, 7, 10],
    leadGain: 0.06,
    bassGain: 0.1,
    padGain: 0.08,
    drumGain: 0.13,
    lowpassHz: 2_000
  }
};

const musicProfiles: Record<string, MusicProfile> = {
  [LOBBY_TRACK_ID]: createProfile(musicTemplates.lobby, {
    bpm: 84,
    rootMidi: 52,
    masterGain: 0.12
  }),
  [LOOKUP_DEFAULT_TRACK_ID]: createProfile(musicTemplates.lobby, {
    bpm: 96,
    rootMidi: 50,
    masterGain: 0.12
  }),
  "light-trails": createProfile(musicTemplates.chase, {
    bpm: 144,
    rootMidi: 57,
    masterGain: 0.16
  }),
  "arena-survivor": createProfile(musicTemplates.battle, {
    bpm: 108,
    rootMidi: 45,
    masterGain: 0.18
  }),
  "minions-td": createProfile(musicTemplates.strategy, {
    bpm: 96,
    rootMidi: 43,
    masterGain: 0.16
  }),
  pantomime: createProfile(musicTemplates.gentle, {
    bpm: 112,
    rootMidi: 59,
    masterGain: 0.12
  }),
  "tap-race": createProfile(musicTemplates.arcade, {
    bpm: 148,
    rootMidi: 65,
    masterGain: 0.16
  }),
  imposter: createProfile(musicTemplates.mystery, {
    bpm: 98,
    rootMidi: 46,
    masterGain: 0.11
  }),
  tabu: createProfile(musicTemplates.arcade, {
    bpm: 124,
    rootMidi: 57,
    masterGain: 0.13
  }),
  "zeichnen-und-erraten": createProfile(musicTemplates.gentle, {
    bpm: 90,
    rootMidi: 62,
    masterGain: 0.11
  }),
  "air-hockey": createProfile(musicTemplates.sports, {
    bpm: 134,
    rootMidi: 58,
    masterGain: 0.16
  })
};

function resolveDesiredTrackId(state: HostAppState): string {
  const selectedGameId = state.room?.selectedGameId;
  return selectedGameId ? selectedGameId : LOBBY_TRACK_ID;
}

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function createNoiseBuffer(
  context: OfflineAudioContext,
  durationSeconds = 0.18
): AudioBuffer {
  const buffer = context.createBuffer(
    1,
    Math.max(1, Math.ceil(context.sampleRate * durationSeconds)),
    context.sampleRate
  );
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  return buffer;
}

function scheduleTone(
  context: OfflineAudioContext,
  destination: AudioNode,
  options: {
    time: number;
    duration: number;
    frequency: number;
    wave: OscillatorType;
    gain: number;
    lowpassHz: number;
    pan?: number;
    attack?: number;
    release?: number;
  }
): void {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const panner = context.createStereoPanner();
  const gainNode = context.createGain();
  const attack = options.attack ?? 0.01;
  const release = options.release ?? 0.08;
  const sustainEnd = Math.max(options.time + attack, options.time + options.duration - release);

  oscillator.type = options.wave;
  oscillator.frequency.setValueAtTime(options.frequency, options.time);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(options.lowpassHz, options.time);
  panner.pan.setValueAtTime(options.pan ?? 0, options.time);
  gainNode.gain.setValueAtTime(0.0001, options.time);
  gainNode.gain.linearRampToValueAtTime(options.gain, options.time + attack);
  gainNode.gain.setValueAtTime(options.gain, sustainEnd);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, options.time + options.duration);

  oscillator.connect(filter);
  filter.connect(panner);
  panner.connect(gainNode);
  gainNode.connect(destination);

  oscillator.start(options.time);
  oscillator.stop(options.time + options.duration + 0.05);
}

function scheduleKick(
  context: OfflineAudioContext,
  destination: AudioNode,
  time: number,
  gain: number
): void {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(150, time);
  oscillator.frequency.exponentialRampToValueAtTime(42, time + 0.12);
  gainNode.gain.setValueAtTime(Math.max(0.001, gain), time);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

  oscillator.connect(gainNode);
  gainNode.connect(destination);
  oscillator.start(time);
  oscillator.stop(time + 0.2);
}

function scheduleNoiseHit(
  context: OfflineAudioContext,
  destination: AudioNode,
  noiseBuffer: AudioBuffer,
  options: {
    time: number;
    gain: number;
    duration: number;
    highpassHz: number;
    pan?: number;
  }
): void {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const panner = context.createStereoPanner();
  const gainNode = context.createGain();

  source.buffer = noiseBuffer;
  filter.type = "highpass";
  filter.frequency.setValueAtTime(options.highpassHz, options.time);
  panner.pan.setValueAtTime(options.pan ?? 0, options.time);
  gainNode.gain.setValueAtTime(Math.max(0.0001, options.gain), options.time);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, options.time + options.duration);

  source.connect(filter);
  filter.connect(panner);
  panner.connect(gainNode);
  gainNode.connect(destination);

  source.start(options.time);
  source.stop(options.time + options.duration + 0.02);
}

async function renderTrackLoop(profile: MusicProfile): Promise<AudioBuffer> {
  const bars = 8;
  const beatsPerBar = 4;
  const stepsPerBeat = 4;
  const stepsPerBar = beatsPerBar * stepsPerBeat;
  const totalSteps = bars * beatsPerBar * stepsPerBeat;
  const stepDuration = 60 / profile.bpm / stepsPerBeat;
  const beatDuration = 60 / profile.bpm;
  const durationSeconds = stepDuration * totalSteps;
  const sampleRate = 44_100;
  const context = new OfflineAudioContext(
    2,
    Math.max(1, Math.ceil(durationSeconds * sampleRate)),
    sampleRate
  );
  const masterGain = context.createGain();
  const lowpass = context.createBiquadFilter();
  const compressor = context.createDynamicsCompressor();
  const noiseBuffer = createNoiseBuffer(context);

  masterGain.gain.value = profile.masterGain;
  lowpass.type = "lowpass";
  lowpass.frequency.value = profile.lowpassHz;
  compressor.threshold.value = -18;
  compressor.knee.value = 14;
  compressor.ratio.value = 3.2;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.18;

  masterGain.connect(lowpass);
  lowpass.connect(compressor);
  compressor.connect(context.destination);

  for (let barIndex = 0; barIndex < bars; barIndex += 1) {
    const barOffset = profile.barProgression[barIndex % profile.barProgression.length] ?? 0;
    const isVariationSection = barIndex >= bars / 2;

    for (let beatIndex = 0; beatIndex < profile.padPattern.length; beatIndex += 1) {
      const noteOffset = profile.padPattern[beatIndex];

      if (noteOffset === null || noteOffset === undefined) {
        continue;
      }

      const startTime = (barIndex * beatsPerBar + beatIndex) * beatDuration;

      for (const chordOffset of profile.padChordIntervals) {
        scheduleTone(context, masterGain, {
          time: startTime,
          duration: beatDuration * (isVariationSection ? 2.15 : 1.9),
          frequency: midiToFrequency(profile.rootMidi + barOffset + noteOffset + chordOffset),
          wave: profile.padWave,
          gain: (profile.padGain / Math.max(1, profile.padChordIntervals.length)) * (isVariationSection ? 1.08 : 1),
          lowpassHz: Math.max(700, profile.lowpassHz - 900),
          pan: (chordOffset - 6) / 16,
          attack: 0.08,
          release: isVariationSection ? 0.34 : 0.28
        });
      }
    }
  }

  for (let stepIndex = 0; stepIndex < totalSteps; stepIndex += 1) {
    const time = stepIndex * stepDuration;
    const stepInBar = stepIndex % stepsPerBar;
    const barIndex = Math.floor(stepIndex / stepsPerBar);
    const barOffset = profile.barProgression[barIndex % profile.barProgression.length] ?? 0;
    const isVariationSection = barIndex >= bars / 2;
    const isTurnaroundBar = barIndex === bars - 1;
    const bassOffset = profile.bassPattern[stepInBar];
    const leadOffset = profile.leadPattern[stepInBar];
    const kick = profile.kickPattern[stepInBar] ?? 0;
    const snare = profile.snarePattern[stepInBar] ?? 0;
    const hat = profile.hatPattern[stepInBar] ?? 0;

    if (bassOffset !== null && bassOffset !== undefined) {
      const bassAccent = stepInBar === 0 ? 1.12 : 1;
      scheduleTone(context, masterGain, {
        time,
        duration: stepDuration * 2.6,
        frequency: midiToFrequency(profile.rootMidi - 12 + barOffset + bassOffset),
        wave: profile.bassWave,
        gain: profile.bassGain * bassAccent,
        lowpassHz: Math.max(420, profile.lowpassHz - 1_150),
        pan: -0.08,
        attack: 0.01,
        release: 0.12
      });
    }

    if (leadOffset !== null && leadOffset !== undefined) {
      const leadLift = isVariationSection && stepInBar % 8 === 0 ? 12 : 0;
      const leadGainMultiplier = isVariationSection && stepInBar >= 8 ? 1.08 : 1;
      scheduleTone(context, masterGain, {
        time,
        duration: stepDuration * (isVariationSection && stepInBar >= 12 ? 2.3 : 1.8),
        frequency: midiToFrequency(profile.rootMidi + 12 + barOffset + leadOffset + leadLift),
        wave: profile.leadWave,
        gain: profile.leadGain * leadGainMultiplier,
        lowpassHz: Math.max(1_000, profile.lowpassHz + 900),
        pan: (stepInBar + barIndex) % 2 === 0 ? -0.12 : 0.12,
        attack: 0.008,
        release: 0.1
      });
    }

    if (kick > 0) {
      scheduleKick(context, masterGain, time, profile.drumGain * kick * (isVariationSection ? 1.04 : 1));
    }

    if (snare > 0) {
      scheduleNoiseHit(context, masterGain, noiseBuffer, {
        time,
        gain: profile.drumGain * snare * 0.7 * (isVariationSection ? 1.05 : 1),
        duration: 0.13,
        highpassHz: 1_600,
        pan: 0.06
      });
    }

    if (hat > 0) {
      scheduleNoiseHit(context, masterGain, noiseBuffer, {
        time,
        gain: profile.drumGain * hat * 0.34,
        duration: 0.05,
        highpassHz: 4_800,
        pan: -0.08
      });
    }

    if (isTurnaroundBar && stepInBar >= 12 && stepInBar % 2 === 1) {
      scheduleNoiseHit(context, masterGain, noiseBuffer, {
        time,
        gain: profile.drumGain * 0.05,
        duration: 0.04,
        highpassHz: 5_400,
        pan: 0.08
      });
    }
  }

  return context.startRendering();
}

class HostBackgroundMusicController {
  private readonly bufferCache = new Map<string, Promise<AudioBuffer>>();
  private readonly unsubscribe: () => void;
  private readonly visibilityHandler = () => {
    if (document.hidden) {
      void this.audioContext?.suspend();
      return;
    }

    if (this.unlocked) {
      void this.audioContext?.resume();
      void this.syncTrack();
    }
  };

  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentTrackGain: GainNode | null = null;
  private currentTrackId: string | null = null;
  private desiredTrackId: string;
  private unlocked = false;
  private disposed = false;
  private unlockCleanup: (() => void) | null = null;

  constructor(private readonly client: HostSocketClient) {
    this.desiredTrackId = resolveDesiredTrackId(client.getState());
    this.unsubscribe = client.subscribe((state) => {
      this.desiredTrackId = resolveDesiredTrackId(state);
      void this.syncTrack();
    });
    this.unlockCleanup = this.installUnlockListeners();
    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  dispose(): void {
    this.disposed = true;
    this.unsubscribe();
    this.unlockCleanup?.();
    this.unlockCleanup = null;
    document.removeEventListener("visibilitychange", this.visibilityHandler);

    if (this.currentTrackGain && this.audioContext) {
      this.currentTrackGain.gain.cancelScheduledValues(this.audioContext.currentTime);
      this.currentTrackGain.gain.setTargetAtTime(0.0001, this.audioContext.currentTime, 0.05);
    }

    this.currentSource?.stop();
    this.currentSource = null;
    this.currentTrackGain = null;
    this.masterGain?.disconnect();
    this.masterGain = null;
    void this.audioContext?.close();
    this.audioContext = null;
  }

  private installUnlockListeners(): () => void {
    const unlock = () => {
      void this.unlockAudio();
    };

    for (const eventName of MUSIC_UNLOCK_EVENTS) {
      window.addEventListener(eventName, unlock, { passive: true });
    }

    return () => {
      for (const eventName of MUSIC_UNLOCK_EVENTS) {
        window.removeEventListener(eventName, unlock);
      }
    };
  }

  private async unlockAudio(): Promise<void> {
    if (this.disposed || this.unlocked) {
      return;
    }

    const audioContext = this.ensureAudioContext();
    await audioContext.resume();
    this.unlocked = true;
    this.unlockCleanup?.();
    this.unlockCleanup = null;
    await this.syncTrack();
  }

  private ensureAudioContext(): AudioContext {
    if (this.audioContext && this.masterGain) {
      return this.audioContext;
    }

    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.audioContext.destination);

    return this.audioContext;
  }

  private async syncTrack(): Promise<void> {
    if (!this.unlocked || this.disposed) {
      return;
    }

    const audioContext = this.ensureAudioContext();

    if (document.hidden) {
      return;
    }

    if (this.currentTrackId === this.desiredTrackId && this.currentSource) {
      return;
    }

    const nextTrackId = this.desiredTrackId;
    const buffer = await this.getTrackBuffer(nextTrackId);

    if (this.disposed || !this.unlocked || nextTrackId !== this.desiredTrackId) {
      return;
    }

    const trackGain = audioContext.createGain();
    const source = audioContext.createBufferSource();
    const startTime = audioContext.currentTime + 0.03;
    const previousSource = this.currentSource;
    const previousTrackGain = this.currentTrackGain;

    source.buffer = buffer;
    source.loop = true;
    trackGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    trackGain.gain.exponentialRampToValueAtTime(1, startTime + 0.45);
    source.connect(trackGain);
    trackGain.connect(this.masterGain!);
    source.onended = () => {
      source.disconnect();
      trackGain.disconnect();
    };
    source.start(startTime);

    if (previousTrackGain) {
      previousTrackGain.gain.cancelScheduledValues(audioContext.currentTime);
      previousTrackGain.gain.setValueAtTime(
        Math.max(0.0001, previousTrackGain.gain.value || 0.0001),
        audioContext.currentTime
      );
      previousTrackGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.4);
    }

    if (previousSource) {
      previousSource.stop(audioContext.currentTime + 0.45);
    }

    this.currentSource = source;
    this.currentTrackGain = trackGain;
    this.currentTrackId = nextTrackId;
  }

  private getTrackBuffer(trackId: string): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(trackId);

    if (cached) {
      return cached;
    }

    const profile = musicProfiles[trackId] ?? musicProfiles[LOOKUP_DEFAULT_TRACK_ID];
    const promise = renderTrackLoop(profile);
    this.bufferCache.set(trackId, promise);
    return promise;
  }
}

export function mountBackgroundMusic(client: HostSocketClient): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => undefined;
  }

  const controller = new HostBackgroundMusicController(client);
  return () => controller.dispose();
}
