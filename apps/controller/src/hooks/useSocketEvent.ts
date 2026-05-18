import { useEffect } from "react";

export function useSocketEvent(subscribe: (() => void) | (() => () => void)): void {
  useEffect(() => subscribe(), [subscribe]);
}
