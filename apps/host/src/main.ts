import { bootstrapHostApp } from "./app/appBootstrap.js";
import { bootstrapChaosKommandoRigLab } from "./games/chaos-kommando/lab/bootstrapChaosKommandoRigLab.js";

const url = new URL(window.location.href);
const lab = url.searchParams.get("lab");

if (lab === "chaos-kommando-rig") {
  bootstrapChaosKommandoRigLab();
} else {
  bootstrapHostApp();
}
