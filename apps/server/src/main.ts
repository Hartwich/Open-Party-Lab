import { createApp } from "./app.js";

const app = createApp();

app.start().catch((error: unknown) => {
  console.error("[server:error]", error);
  process.exitCode = 1;
});
