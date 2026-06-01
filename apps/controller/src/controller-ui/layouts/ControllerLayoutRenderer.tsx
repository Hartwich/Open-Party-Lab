import { LeftRightHoldLayout } from "./LeftRightHoldLayout.js";
import { DPadLayout } from "./DPadLayout.js";
import { SingleButtonLayout } from "./SingleButtonLayout.js";
import { ChoiceLayout } from "./ChoiceLayout.js";
import { ShopLayout } from "./ShopLayout.js";
import { ArenaSurvivorModernShopLayout } from "./ArenaSurvivorModernShopLayout.js";
import { TapMashLayout } from "./TapMashLayout.js";
import { VirtualJoystickLayout } from "./VirtualJoystickLayout.js";
import { ChaosKommandoLayout } from "./ChaosKommandoLayout.js";
import { TowerDefenseLayout } from "./TowerDefenseLayout.js";
import { TwinStickLayout } from "./TwinStickLayout.js";
import { DrawingGuessLayout } from "./DrawingGuessLayout.js";
import { RacingControlsLayout } from "./RacingControlsLayout.js";
import { SchaetzoramaLayout } from "./SchaetzoramaLayout.js";
import { WordTilesLayout } from "./WordTilesLayout.js";
import { SpellCastingLayout } from "./SpellCastingLayout.js";
import { MagicArenaLayout } from "./MagicArenaLayout.js";
import type { ControllerLayoutModel } from "./models.js";

interface ControllerLayoutRendererProps {
  model: ControllerLayoutModel;
}

export function ControllerLayoutRenderer({ model }: ControllerLayoutRendererProps) {
  switch (model.kind) {
    case "left_right_hold":
      return <LeftRightHoldLayout model={model} />;
    case "dpad":
      return <DPadLayout model={model} />;
    case "virtual_joystick":
      return <VirtualJoystickLayout model={model} />;
    case "racing_controls":
      return <RacingControlsLayout model={model} />;
    case "chaos_kommando_controls":
      return <ChaosKommandoLayout model={model} />;
    case "tower_defense":
      return <TowerDefenseLayout model={model} />;
    case "twin_stick":
      return <TwinStickLayout model={model} />;
    case "spell_casting":
      return <SpellCastingLayout model={model} />;
    case "shop":
      return <ShopLayout model={model} />;
    case "arena_survivor_modern_shop":
      return <ArenaSurvivorModernShopLayout model={model} />;
    case "single_button":
      return <SingleButtonLayout model={model} />;
    case "choice":
      return <ChoiceLayout model={model} />;
    case "tap_mash":
      return <TapMashLayout model={model} />;
    case "drawing_guess":
      return <DrawingGuessLayout model={model} />;
    case "schaetzorama":
      return <SchaetzoramaLayout model={model} />;
    case "word_tiles_board":
      return <WordTilesLayout model={model} />;
    case "magic_arena":
      return <MagicArenaLayout model={model} />;
    default:
      return null;
  }
}
