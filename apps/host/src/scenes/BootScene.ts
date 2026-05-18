import Phaser from "phaser";
import { hostTheme } from "../ui/theme/theme.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(hostTheme.background);

    const width = Math.max(this.scale.width - 64, 240);
    const titleSize = this.scale.width < 640 ? "28px" : "42px";
    const bodySize = this.scale.width < 640 ? "16px" : "24px";

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 40, "Verbinde Host mit Server ...", {
        fontFamily: hostTheme.titleFont,
        fontSize: titleSize,
        color: hostTheme.text,
        wordWrap: { width },
        align: "center"
      })
      .setOrigin(0.5);

    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 + 48,
        "Dies ist die Host-Ansicht. Auf dem Handy bitte den Controller-Link oder den QR-Code verwenden.",
        {
          fontFamily: hostTheme.bodyFont,
          fontSize: bodySize,
          color: hostTheme.muted,
          wordWrap: { width },
          align: "center"
        }
      )
      .setOrigin(0.5);
  }
}
