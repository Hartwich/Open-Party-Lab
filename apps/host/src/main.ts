import { bootstrapHostApp } from "./app/appBootstrap.js";
import { mountHostedLanding } from "./app/hostedLanding.js";

const hostedBuild = import.meta.env.VITE_OPEN_PARTY_LAB_HOSTED === "1";
const isHostRoute = window.location.pathname === "/host" || window.location.pathname.startsWith("/host/");

if (hostedBuild && !isHostRoute) {
  mountHostedLanding();
} else {
  const roomCode = hostedBuild
    ? new URLSearchParams(window.location.search).get("room")?.trim().toUpperCase() || null
    : null;

  if (hostedBuild && !roomCode) {
    window.location.replace("/");
  } else {
    bootstrapHostApp(roomCode);
  }
}
