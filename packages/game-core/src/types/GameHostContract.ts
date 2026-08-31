/**
 * What a game owns on the shared screen.
 *
 * The platform provides the room, the catalog, the round lifecycle and the
 * shared libraries. Everything a player looks at *during* a game — the intro,
 * the playfield and the result screen — belongs to the game itself.
 *
 * Before this contract existed the platform carried a scoreboard scene, a
 * round-intro scene and a growing chain of `if (gameId === "…")` checks that
 * suppressed them for the three games that had outgrown them. Those checks are
 * now declarations a game makes about itself.
 */

/** Lifecycle screens a game can take over from the platform. */
export type HostOwnedScreen = "round_intro" | "result";

/**
 * Platform chrome a game can opt out of.
 *
 * Defaults are permissive: a game that declares nothing gets the full chrome,
 * which is the right behaviour for a simple game that has no reason to hide it.
 */
export interface GameHostChromeOptions {
  /** QR / join card. Off for games that need the whole screen in the lobby. */
  joinOverlay?: boolean;
  /** Room code, connection and player-count strip in the corner. */
  hud?: boolean;
  /** Room code inside scene headers. Off for games that show it themselves. */
  roomCode?: boolean;
  /** Whether the join card stays visible once a round has finished. */
  joinOverlayWhenFinished?: boolean;
}

export const defaultHostChrome: Required<GameHostChromeOptions> = {
  joinOverlay: true,
  hud: true,
  roomCode: true,
  joinOverlayWhenFinished: true
};

/** Resolves a game's chrome preferences against the platform defaults. */
export function resolveHostChrome(
  options: GameHostChromeOptions | undefined
): Required<GameHostChromeOptions> {
  return { ...defaultHostChrome, ...options };
}

/**
 * Phone chrome a game can opt out of.
 *
 * Layouts that fill the screen — gamepads, joysticks, drawing boards — used to
 * be listed by id inside the controller page. A game now states what it needs.
 */
export interface GameControllerChromeOptions {
  /** Hide title, phase, score and sign-out; the layout owns the screen. */
  minimal?: boolean;
  /** Wider frame, for gamepad-style and dense board layouts. */
  wide?: boolean;
  /** No frame at all. */
  bare?: boolean;
  /** Keep the frame but drop the phase subtitle. */
  hideSubtitle?: boolean;
}

export const defaultControllerChrome: Required<GameControllerChromeOptions> = {
  minimal: false,
  wide: false,
  bare: false,
  hideSubtitle: false
};

/** Resolves a game's phone chrome against the platform defaults. */
export function resolveControllerChrome(
  options: GameControllerChromeOptions | undefined
): Required<GameControllerChromeOptions> {
  return { ...defaultControllerChrome, ...options };
}

/**
 * Catalog appearance.
 *
 * `accent` is the only required value; the platform derives card surfaces and
 * tints from it so every catalog entry keeps the same lightness.
 */
export interface GameVisualDefinition {
  /** `#rrggbb`. Muted, earthy hues read best on the warm paper background. */
  accent: string;
  /** Short category word above the title, e.g. "Arena", "Words". */
  eyebrow?: string;
  /** Optional SVG served from the game's public assets. */
  iconPath?: string;
}

/**
 * Broadcast tuning.
 *
 * Two games needed hand-written exceptions in the state broadcaster: one sends
 * large per-tick state that compresses well into deltas, the other floods the
 * controllers. Both are now numbers a game declares.
 */
export interface GameBroadcastPolicy {
  /** Minimum gap between host state emits while playing. */
  hostStateIntervalMs?: number;
  /** Minimum gap between controller state emits while playing. */
  controllerStateIntervalMs?: number;
  /**
   * Whether the server may send incremental host patches instead of full
   * state. The game's protocol package must define the patch shape.
   */
  supportsHostPatches?: boolean;
}

/**
 * Background music.
 *
 * The platform owns the synthesiser and a set of generic instrument templates;
 * a game picks one and tunes it. This keeps the audio engine shared without the
 * platform holding a table of game ids.
 */
export interface GameAudioTrack {
  /** Instrument template: "lobby", "battle", "chase", "arcade", "gentle", … */
  profile: string;
  bpm?: number;
  rootMidi?: number;
  masterGain?: number;
}

export interface GameAudioDefinition {
  track: GameAudioTrack;
  /**
   * Per-setting overrides, so a game can swap its track when a lobby setting
   * changes — theme pickers, difficulty, and so on.
   */
  trackBySetting?: {
    settingKey: string;
    values: Readonly<Record<string, GameAudioTrack>>;
  };
}

/** Resolves the track for the current lobby settings. */
export function resolveGameAudioTrack(
  audio: GameAudioDefinition | undefined,
  settings: Readonly<Record<string, string | number | boolean>> | undefined
): GameAudioTrack | undefined {
  if (!audio) {
    return undefined;
  }

  const override = audio.trackBySetting;

  if (override && settings) {
    const value = settings[override.settingKey];

    if (value !== undefined) {
      const track = override.values[String(value)];

      if (track) {
        return track;
      }
    }
  }

  return audio.track;
}
