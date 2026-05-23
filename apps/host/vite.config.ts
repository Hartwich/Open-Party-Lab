import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@open-party-lab/protocol": fileURLToPath(
        new URL("../../packages/protocol/src/index.ts", import.meta.url)
      ),
      "@open-party-lab/game-core": fileURLToPath(
        new URL("../../packages/game-core/src/index.ts", import.meta.url)
      ),
      "@open-party-lab/ui-kit": fileURLToPath(
        new URL("../../packages/ui-kit/src/index.ts", import.meta.url)
      )
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("/node_modules/phaser/")) {
            return "phaser";
          }

          if (normalizedId.includes("/node_modules/socket.io-client/")) {
            return "socket-io";
          }

          if (normalizedId.includes("/node_modules/qrcode/")) {
            return "qrcode";
          }

          const gameMatch = normalizedId.match(/\/src\/games\/([^/]+)\//);

          if (gameMatch) {
            return `game-${gameMatch[1]}`;
          }

          if (normalizedId.includes("/src/scenes/")) {
            return "host-scenes";
          }

          if (normalizedId.includes("/node_modules/")) {
            return "vendor";
          }

          return undefined;
        }
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173
  },
  preview: {
    host: "0.0.0.0",
    port: 4173
  }
});
