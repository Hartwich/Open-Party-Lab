type WakeLockSentinelLike = EventTarget & {
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: EventListenerOrEventListenerObject) => void;
  removeEventListener: (type: "release", listener: EventListenerOrEventListenerObject) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

export function mountScreenWakeLock(): () => void {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof navigator === "undefined"
  ) {
    return () => undefined;
  }

  const nav = navigator as WakeLockNavigator;

  if (!nav.wakeLock?.request) {
    return () => undefined;
  }

  let active = true;
  let wakeLock: WakeLockSentinelLike | null = null;

  const handleRelease = () => {
    wakeLock?.removeEventListener("release", handleRelease);
    wakeLock = null;

    if (active && document.visibilityState === "visible") {
      void requestWakeLock();
    }
  };

  const releaseWakeLock = () => {
    if (!wakeLock) {
      return;
    }

    const currentWakeLock = wakeLock;
    wakeLock = null;
    currentWakeLock.removeEventListener("release", handleRelease);
    void currentWakeLock.release().catch(() => undefined);
  };

  const requestWakeLock = async () => {
    if (!active || document.visibilityState !== "visible" || wakeLock) {
      return;
    }

    try {
      const nextWakeLock = await nav.wakeLock.request("screen");

      if (!active) {
        void nextWakeLock.release().catch(() => undefined);
        return;
      }

      wakeLock = nextWakeLock;
      wakeLock.addEventListener("release", handleRelease);
    } catch {
      wakeLock = null;
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      void requestWakeLock();
    }
  };

  const handleInteraction = () => {
    if (!wakeLock) {
      void requestWakeLock();
    }
  };

  void requestWakeLock();
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pointerdown", handleInteraction, { passive: true });
  window.addEventListener("touchstart", handleInteraction, { passive: true });
  window.addEventListener("keydown", handleInteraction);

  return () => {
    active = false;
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pointerdown", handleInteraction);
    window.removeEventListener("touchstart", handleInteraction);
    window.removeEventListener("keydown", handleInteraction);
    releaseWakeLock();
  };
}
