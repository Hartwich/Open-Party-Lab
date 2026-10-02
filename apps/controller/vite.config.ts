import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  define: process.env.OPEN_PARTY_LAB_RELEASE_BUILD
    ? { "import.meta.env.VITE_SERVER_URL": "undefined" }
    : undefined,
  base: process.env.OPEN_PARTY_LAB_RELEASE_BUILD ? "/controller/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@open-party-lab/protocol": fileURLToPath(
        new URL("../../packages/protocol/src/index.ts", import.meta.url)
      ),
      "@open-party-lab/game-core": fileURLToPath(
        new URL("../../packages/game-core/src/index.ts", import.meta.url)
      )
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5174
  },
  preview: {
    host: "0.0.0.0",
    port: 4174
  }
});
