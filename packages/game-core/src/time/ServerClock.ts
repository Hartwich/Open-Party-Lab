/** A server wall clock advanced with monotonic time, independent of the device clock. */
export class ServerClock {
  private anchor: number;
  private anchorAt: number;
  private bestRoundTrip = Infinity;
  private sampledAt = -Infinity;

  constructor(private readonly monotonic = () => performance.now(), wallTime = Date.now()) {
    this.anchor = wallTime;
    this.anchorAt = monotonic();
  }

  readonly now = (): number => this.anchor + this.monotonic() - this.anchorAt;

  initialize(serverTime: number): void {
    if (!Number.isFinite(serverTime)) return;
    this.anchor = serverTime;
    this.anchorAt = this.monotonic();
    this.bestRoundTrip = Infinity;
  }

  synchronize(serverTime: number, sentAt: number): boolean {
    const receivedAt = this.monotonic();
    const roundTrip = receivedAt - sentAt;
    if (!Number.isFinite(serverTime) || !Number.isFinite(roundTrip) || roundTrip < 0 || roundTrip > 2000) return false;
    // Prefer the least delayed sample; periodically refresh it to follow clock drift.
    if (roundTrip > this.bestRoundTrip && receivedAt - this.sampledAt < 30000) return false;
    this.anchor = serverTime + roundTrip / 2;
    this.anchorAt = receivedAt;
    this.bestRoundTrip = roundTrip;
    this.sampledAt = receivedAt;
    return true;
  }
}

/** Recalibrate after connect and during play; disconnect cancels outstanding replies. */
export function startServerClockSync(clock: ServerClock, request: (reply: (serverTime: number) => void) => void): () => void {
  let active = true;
  const sample = () => {
    const sentAt = performance.now();
    request((serverTime) => { if (active) clock.synchronize(serverTime, sentAt); });
  };
  sample();
  const second = setTimeout(sample, 250);
  const third = setTimeout(sample, 750);
  const refresh = setInterval(sample, 5000);
  return () => { active = false; clearTimeout(second); clearTimeout(third); clearInterval(refresh); };
}
