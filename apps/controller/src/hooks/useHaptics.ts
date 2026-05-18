export function useHaptics() {
  function trigger(pattern: number | number[]): void {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  return {
    tap(duration = 20): void {
      trigger(duration);
    },
    pattern(pattern: number | number[]): void {
      trigger(pattern);
    }
  };
}
