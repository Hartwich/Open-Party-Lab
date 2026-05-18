import Phaser from "phaser";
import type { SupportedLanguage, TabuMode } from "@open-party-lab/protocol";
import { hostTheme } from "../../../ui/theme/theme.js";

interface TabuHudOptions {
  roomCode: string;
  mode: TabuMode;
  language?: SupportedLanguage;
  onSelectMode: (mode: TabuMode) => void;
}

function createModeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  label: string,
  active: boolean,
  onClick: () => void
): void {
  const fill = active ? 0x1d4ed8 : 0x0f172a;
  const stroke = active ? 0x60a5fa : 0x334155;

  scene.add.rectangle(x, y, width, 42, fill, 0.92).setOrigin(0).setStrokeStyle(1, stroke, 0.95);
  scene.add
    .text(x + width / 2, y + 21, label, {
      fontFamily: hostTheme.bodyFont,
      fontSize: "14px",
      color: hostTheme.text,
      align: "center"
    })
    .setOrigin(0.5);

  const zone = scene.add.zone(x, y, width, 42).setOrigin(0).setInteractive({ useHandCursor: true });

  zone.on("pointerdown", () => {
    onClick();
  });
}

export function renderTabuHud(scene: Phaser.Scene, options: TabuHudOptions): number {
  const en = options.language === "en";

  scene.add.text(40, 24, `${en ? "Room" : "Raum"} ${options.roomCode}`, {
    fontFamily: hostTheme.monoFont,
    fontSize: "22px",
    color: hostTheme.muted
  });
  scene.add.text(40, 52, en ? "Taboo Mode" : "Tabu Modus", {
    fontFamily: hostTheme.titleFont,
    fontSize: "30px",
    color: hostTheme.text
  });
  scene.add.text(40, 82, en ? "Change the game mode before the start or between rounds." : "Wandle den Spielmodus vor dem Start oder zwischen Runden um.", {
    fontFamily: hostTheme.bodyFont,
    fontSize: "15px",
    color: hostTheme.muted
  });

  createModeButton(
    scene,
    40,
    118,
    176,
    en ? "Free-for-all" : "Jeder gegen jeden",
    options.mode === "duel",
    () => options.onSelectMode("duel")
  );
  createModeButton(
    scene,
    226,
    118,
    132,
    en ? "Team Mode" : "Teammodus",
    options.mode === "team",
    () => options.onSelectMode("team")
  );

  return 176;
}
