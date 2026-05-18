import { useRef } from "react";

interface SwipePadProps {
  onSwipe: (direction: "up" | "right" | "down" | "left") => void;
}

export function SwipePad({ onSwipe }: SwipePadProps) {
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      onPointerDown={(event) => {
        startPoint.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        if (!startPoint.current) {
          return;
        }

        const deltaX = event.clientX - startPoint.current.x;
        const deltaY = event.clientY - startPoint.current.y;
        const horizontal = Math.abs(deltaX) > Math.abs(deltaY);

        if (horizontal) {
          onSwipe(deltaX >= 0 ? "right" : "left");
        } else {
          onSwipe(deltaY >= 0 ? "down" : "up");
        }

        startPoint.current = null;
      }}
      style={{
        minHeight: 220,
        borderRadius: 28,
        border: "1px dashed var(--panel-border)",
        display: "grid",
        placeItems: "center",
        color: "var(--text-muted)"
      }}
    >
      Wischen
    </div>
  );
}
