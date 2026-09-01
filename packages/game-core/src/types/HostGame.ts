/**
 * What a game registers with the host application.
 *
 * `scene` is typed loosely here because `game-core` must not depend on Phaser —
 * the host casts it when handing it to the Phaser config.
 */
export interface HostGameStateSource<TState = unknown> {
  getState(): TState | null;
  subscribe(callback: (state: TState) => void): () => void;
}

export interface HostGame {
  id: string;
  displayName?: string;
  sceneKey?: string;
  scene?: unknown;
  /**
   * Mounts a resolution-independent DOM surface for games that do not need a
   * canvas. `root` is an HTMLElement at runtime; it stays unknown here because
   * game-core deliberately compiles without the DOM library.
   */
  mountDom?(root: unknown, client: HostGameStateSource): () => void;
  /**
   * Merges an incremental state patch from the server into the state the host
   * already has, and returns the merged result — or null to make the host wait
   * for a full state instead.
   *
   * Only games that opt into `broadcast.supportsHostPatches` receive patches.
   * The platform used to implement one game's merge inline, which meant the
   * host had to know that game's state shape.
   */
  applyHostPatch?<TState = unknown, TPatch = unknown>(
    currentState: TState,
    patch: TPatch
  ): TState | null;
}
