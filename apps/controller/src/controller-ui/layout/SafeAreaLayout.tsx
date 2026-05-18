import type { PropsWithChildren } from "react";

export function SafeAreaLayout({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "max(10px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))"
      }}
    >
      {children}
    </div>
  );
}
