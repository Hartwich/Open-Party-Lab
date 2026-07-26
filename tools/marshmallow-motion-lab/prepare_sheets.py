"""Split, anchor and color-normalize both real 4x4 motion sheets."""

from __future__ import annotations

import json
from pathlib import Path
from statistics import median

import numpy as np
from PIL import Image

ROOT = Path(__file__).parent
RAW = ROOT / "assets" / "raw"
OUTPUT = ROOT / "assets" / "frames-16"
PREVIEWS = ROOT / "assets" / "previews"
FRAME_SIZE = 384
TARGET_TORSO_X = 192
GROUND_Y = 366
TARGET_HEIGHT = 340


def split_sheet(path: Path) -> list[Image.Image]:
    sheet = Image.open(path).convert("RGBA")
    width, height = sheet.width // 4, sheet.height // 4
    return [sheet.crop((x * width, y * height, (x + 1) * width, (y + 1) * height))
            for y in range(4) for x in range(4)]


def alpha_box(frame: Image.Image) -> tuple[int, int, int, int]:
    box = frame.getchannel("A").getbbox()
    if box is None:
        raise ValueError("Frame contains no visible pixels")
    return box


def torso_center_x(frame: Image.Image, box: tuple[int, int, int, int]) -> float:
    alpha = np.asarray(frame.getchannel("A"))
    left, top, right, bottom = box
    torso_bottom = top + round((bottom - top) * 0.72)
    _, xs = np.where(alpha[top:torso_bottom, left:right] > 96)
    return float(np.median(xs + left)) if len(xs) else (left + right) / 2


def paste_anchored(frame: Image.Image, scale: float) -> tuple[Image.Image, dict[str, float]]:
    box = alpha_box(frame)
    crop = frame.crop(box)
    scaled = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)
    center_x = (torso_center_x(frame, box) - box[0]) * scale
    x = round(TARGET_TORSO_X - center_x)
    y = GROUND_Y - scaled.height
    canvas = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(scaled, (x, y))
    return canvas, {
        "sourceWidth": box[2] - box[0],
        "sourceHeight": box[3] - box[1],
        "torsoX": round(x + center_x, 3),
        "groundY": GROUND_Y,
    }


def visible_medians(frame: Image.Image) -> np.ndarray:
    sample = np.asarray(frame)[55:285, 78:306]
    rgb = sample[:, :, :3][sample[:, :, 3] > 210]
    return np.median(rgb, axis=0) if rgb.size else np.array([255.0, 255.0, 255.0])


def normalize_brightness(frames: list[Image.Image]) -> tuple[list[Image.Image], list[dict[str, object]]]:
    before = [visible_medians(frame) for frame in frames]
    target = np.array([median(values[channel] for values in before) for channel in range(3)])
    normalized, report = [], []
    for frame, source_median in zip(frames, before):
        gain = np.clip(target / np.maximum(source_median, 1), 0.9, 1.1)
        pixels = np.asarray(frame).copy()
        pixels[:, :, :3] = np.clip(pixels[:, :, :3] * gain, 0, 255).astype(np.uint8)
        corrected = Image.fromarray(pixels, "RGBA")
        after = visible_medians(corrected)
        deviation = float(np.max(np.abs(after - target) / np.maximum(target, 1)) * 100)
        normalized.append(corrected)
        report.append({
            "beforeMedianRgb": [round(float(value), 2) for value in source_median],
            "gain": [round(float(value), 4) for value in gain],
            "afterMedianRgb": [round(float(value), 2) for value in after],
            "maxDeviationPercent": round(deviation, 3),
        })
    return normalized, report


def contact_sheet(frames: list[Image.Image]) -> Image.Image:
    size = 192
    canvas = Image.new("RGB", (size * 4, size * 4), "#1a1b18")
    for index, frame in enumerate(frames):
        cell = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (28, 29, 26, 255))
        cell.alpha_composite(frame)
        cell = cell.convert("RGB").resize((size, size), Image.Resampling.LANCZOS)
        canvas.paste(cell, ((index % 4) * size, (index // 4) * size))
    return canvas


def process(name: str) -> dict[str, object]:
    source_frames = split_sheet(RAW / f"{name}-16-alpha.png")
    heights = [alpha_box(frame)[3] - alpha_box(frame)[1] for frame in source_frames]
    common_scale = TARGET_HEIGHT / median(heights)
    anchored_with_data = [paste_anchored(frame, common_scale) for frame in source_frames]
    normalized, brightness = normalize_brightness([item[0] for item in anchored_with_data])
    destination = OUTPUT / name
    destination.mkdir(parents=True, exist_ok=True)
    for index, frame in enumerate(normalized):
        frame.save(destination / f"{index}.png", optimize=True)
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    contact_sheet(normalized).save(PREVIEWS / f"{name}-16.jpg", quality=92)
    return {
        "source": str(RAW / f"{name}-16-alpha.png"),
        "frameCount": 16,
        "commonScale": round(common_scale, 5),
        "alignment": [item[1] for item in anchored_with_data],
        "brightness": brightness,
        "maxBrightnessDeviationPercent": max(item["maxDeviationPercent"] for item in brightness),
    }


def main() -> None:
    report = {name: process(name) for name in ("idle", "walk")}
    report_path = ROOT / "assets" / "sheet-report-16.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Prepared 32 real frames. Report: {report_path}")


if __name__ == "__main__":
    main()
