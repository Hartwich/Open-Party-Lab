import { useEffect } from "react";

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

interface VideoWakeFallback {
  enable: () => Promise<void>;
  disable: () => void;
}

function createVideoWakeFallback(): VideoWakeFallback | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;

  const context = canvas.getContext("2d");
  const captureStream = canvas.captureStream?.bind(canvas);

  if (!context || typeof captureStream !== "function") {
    return null;
  }

  const stream = captureStream(1);

  if (!stream) {
    return null;
  }

  const video = document.createElement("video");
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.style.position = "fixed";
  video.style.width = "1px";
  video.style.height = "1px";
  video.style.opacity = "0";
  video.style.pointerEvents = "none";
  video.style.bottom = "0";
  video.style.left = "0";
  video.style.zIndex = "-1";
  video.srcObject = stream;
  document.body.appendChild(video);

  let keepAliveIntervalId: number | null = null;
  let frameIndex = 0;
  let playing = false;

  const paintFrame = () => {
    const shade = frameIndex % 2 === 0 ? "#000000" : "#010101";
    context.fillStyle = shade;
    context.fillRect(0, 0, 2, 2);
    frameIndex += 1;
  };

  const startKeepAliveFrames = () => {
    if (keepAliveIntervalId !== null) {
      return;
    }

    paintFrame();
    keepAliveIntervalId = window.setInterval(paintFrame, 1_000);
  };

  const stopKeepAliveFrames = () => {
    if (keepAliveIntervalId === null) {
      return;
    }

    window.clearInterval(keepAliveIntervalId);
    keepAliveIntervalId = null;
  };

  return {
    async enable() {
      startKeepAliveFrames();

      if (playing) {
        return;
      }

      try {
        await video.play();
        playing = true;
      } catch {
        playing = false;
      }
    },
    disable() {
      playing = false;
      stopKeepAliveFrames();
      video.pause();
      const mediaStream = video.srcObject;
      video.srcObject = null;

      if (mediaStream instanceof MediaStream) {
        for (const track of mediaStream.getTracks()) {
          track.stop();
        }
      }

      video.remove();
    }
  };
}

export function useWakeHint(enabled: boolean): void {
  useEffect(() => {
    if (
      !enabled ||
      typeof window === "undefined" ||
      typeof document === "undefined" ||
      typeof navigator === "undefined"
    ) {
      return;
    }

    const nav = navigator as WakeLockNavigator;
    const fallback = createVideoWakeFallback();

    if (!nav.wakeLock?.request && !fallback) {
      return;
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
      if (!active || document.visibilityState !== "visible") {
        return;
      }

      if (wakeLock) {
        return;
      }

      if (!nav.wakeLock?.request) {
        await fallback?.enable();
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
        await fallback?.enable();
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
      fallback?.disable();
    };
  }, [enabled]);
}
