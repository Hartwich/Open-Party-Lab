"""Build a labeled contact sheet for reviewing the complete arsenal."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in (
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ):
        if candidate.exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    parser.add_argument("--columns", type=int, default=5)
    args = parser.parse_args()

    manifest = json.loads((ROOT / "weapon-pack.json").read_text(encoding="utf-8"))
    entries = sorted(manifest["weapons"], key=lambda entry: entry["id"])
    tile_width, tile_height = 260, 205
    rows = math.ceil(len(entries) / args.columns)
    sheet = Image.new("RGB", (tile_width * args.columns, tile_height * rows), "#151714")
    draw = ImageDraw.Draw(sheet)
    font = load_font(15)

    for index, entry in enumerate(entries):
        column, row = index % args.columns, index // args.columns
        x, y = column * tile_width, row * tile_height
        draw.rectangle((x, y, x + tile_width - 1, y + tile_height - 1), outline="#3d4038")
        sprite = Image.open((ROOT / entry["asset"]).resolve()).convert("RGBA")
        sprite.thumbnail((tile_width - 24, tile_height - 42), Image.Resampling.LANCZOS)
        sheet.paste(sprite, (x + (tile_width - sprite.width) // 2, y + 8), sprite)
        draw.text((x + 10, y + tile_height - 26), entry["id"], fill="#f2ead9", font=font)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.output, optimize=True)
    print(f"Wrote {args.output} with {len(entries)} assets")


if __name__ == "__main__":
    main()
