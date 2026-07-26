"""Normalize transparent arsenal sprites to their manifest canvas without distortion."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "weapon-pack.json"
PADDING = 32


def normalize(asset: Path, width: int, height: int) -> None:
    image = Image.open(asset).convert("RGBA")
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError(f"Asset contains no visible pixels: {asset.name}")

    crop = image.crop(bounds)
    scale = min((width - 2 * PADDING) / crop.width, (height - 2 * PADDING) / crop.height)
    resized = crop.resize(
        (round(crop.width * scale), round(crop.height * scale)),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.alpha_composite(
        resized,
        ((width - resized.width) // 2, (height - resized.height) // 2),
    )
    canvas.save(asset, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("ids", nargs="*", help="Weapon IDs; omit to normalize the complete pack")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    requested = set(args.ids)
    known = {entry["id"] for entry in manifest["weapons"]}
    unknown = requested - known
    if unknown:
        raise ValueError(f"Unknown weapon IDs: {', '.join(sorted(unknown))}")

    for entry in manifest["weapons"]:
        if requested and entry["id"] not in requested:
            continue
        canvas = manifest["canvasPresets"][entry["canvas"]]
        normalize((ROOT / entry["asset"]).resolve(), canvas["width"], canvas["height"])
        print(f"Normalized {entry['id']} to {canvas['width']}x{canvas['height']}")


if __name__ == "__main__":
    main()
