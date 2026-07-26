"""Erzeugt die nahtlos kachelnden Marshmallow-Texturen fuer das 3D Motion Lab.

    python tools/marshmallow-motion-lab-3d/prepare_textures.py

Schreibt nach assets/textures/:
  marshmallow-albedo.png     Grundfarbe mit Zuckerkorn und Puderzucker
  marshmallow-normal.png     Tangent-Space Normal Map derselben Struktur
  marshmallow-roughness.png  Rauheit, damit Zuckerkoerner leicht glitzern

Alle Texturen sind kachelbar: das Rauschen wird auf einem Torus erzeugt, damit
die Naht der Lathe-Geometrie bei u = 0 nicht sichtbar wird.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

# 512 statt 1024: Die Textur wird mehrfach gekachelt, mehr Aufloesung ist auf dem
# Koerper nicht sichtbar, verdreifacht aber die Dateigroesse im Repository.
SIZE = 512
OUTPUT = Path(__file__).resolve().parent / "assets" / "textures"

# Grundton eines rohen Marshmallows. Die Roestung wird zur Laufzeit als
# Materialfarbe darueber multipliziert, die Textur bleibt deshalb hell.
BASE_COLOR = np.array([250.0, 242.0, 226.0])
GRAIN_COLOR = np.array([255.0, 252.0, 244.0])
SHADE_COLOR = np.array([214.0, 198.0, 172.0])


def tiling_value_noise(size: int, cells: int, generator: np.random.Generator) -> np.ndarray:
    """Value Noise, das sich exakt wiederholt, weil das Gitter zyklisch umlaeuft."""
    lattice = generator.random((cells, cells))
    coordinates = np.linspace(0, cells, size, endpoint=False)
    index = np.floor(coordinates).astype(int)
    fraction = coordinates - index
    # Smoothstep sorgt fuer weiche Uebergaenge ohne sichtbares Gitter.
    weight = fraction * fraction * (3 - 2 * fraction)

    i0 = index % cells
    i1 = (index + 1) % cells
    wx = weight[None, :]
    wy = weight[:, None]

    c00 = lattice[np.ix_(i0, i0)]
    c10 = lattice[np.ix_(i0, i1)]
    c01 = lattice[np.ix_(i1, i0)]
    c11 = lattice[np.ix_(i1, i1)]

    top = c00 * (1 - wx) + c10 * wx
    bottom = c01 * (1 - wx) + c11 * wx
    return top * (1 - wy) + bottom * wy


def fractal_noise(size: int, octaves: int, base_cells: int, seed: int) -> np.ndarray:
    generator = np.random.default_rng(seed)
    total = np.zeros((size, size))
    amplitude = 1.0
    normalisation = 0.0
    for octave in range(octaves):
        cells = base_cells * (2**octave)
        if cells > size:
            break
        total += tiling_value_noise(size, cells, generator) * amplitude
        normalisation += amplitude
        amplitude *= 0.5
    return total / normalisation


def sugar_grain(size: int, seed: int) -> np.ndarray:
    """Feines Korn - die eigentlichen Zuckerkristalle.

    Das Korn entsteht auf halber Aufloesung und wird verdoppelt. Das ergibt
    sichtbare Kristalle statt Einzelpixel-Rauschen und laesst sich als PNG
    deutlich besser komprimieren.
    """
    generator = np.random.default_rng(seed)
    half = generator.random((size // 2, size // 2))
    # Nur die hellsten Punkte bleiben stehen, das ergibt einzelne Kristalle
    # statt eines gleichmaessigen Rauschteppichs.
    half = np.clip((half - 0.78) / 0.22, 0, 1) ** 1.6
    return np.repeat(np.repeat(half, 2, axis=0), 2, axis=1)


def normalise(values: np.ndarray) -> np.ndarray:
    low = values.min()
    high = values.max()
    if high - low < 1e-9:
        return np.zeros_like(values)
    return (values - low) / (high - low)


def build_height(size: int) -> np.ndarray:
    """Hoehenfeld: grosse weiche Dellen, feine Struktur, harte Zuckerkoerner."""
    dents = fractal_noise(size, 4, 3, seed=11)
    structure = fractal_noise(size, 4, 12, seed=23)
    grain = sugar_grain(size, seed=37)
    height = 0.6 * normalise(dents) + 0.3 * normalise(structure) + 0.16 * grain
    return normalise(height)


def build_albedo(height: np.ndarray, size: int) -> Image.Image:
    dust = fractal_noise(size, 3, 6, seed=53)
    dust = normalise(dust)
    grain = sugar_grain(size, seed=71)

    # Vertiefungen werden leicht abgedunkelt, Erhebungen bekommen Puderzucker.
    shade = np.clip(0.62 + 0.38 * height, 0, 1)[..., None]
    colour = SHADE_COLOR + (BASE_COLOR - SHADE_COLOR) * shade
    colour = colour + (GRAIN_COLOR - colour) * (0.55 * grain[..., None])
    colour = colour + (GRAIN_COLOR - colour) * (0.18 * dust[..., None])
    return Image.fromarray(np.clip(colour, 0, 255).astype(np.uint8), mode="RGB")


def build_normal(height: np.ndarray, strength: float = 2.6) -> Image.Image:
    # np.roll haelt die Ableitung ueber den Rand hinweg zyklisch, damit die
    # Normal Map genauso nahtlos kachelt wie die Hoehenkarte.
    dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * 0.5
    dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * 0.5

    normal_x = -dx * strength
    normal_y = -dy * strength
    normal_z = np.ones_like(height)
    length = np.sqrt(normal_x**2 + normal_y**2 + normal_z**2)

    stacked = np.stack(
        [normal_x / length, normal_y / length, normal_z / length], axis=-1
    )
    encoded = np.clip((stacked * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(encoded, mode="RGB")


def build_roughness(height: np.ndarray, size: int) -> Image.Image:
    grain = sugar_grain(size, seed=97)
    patches = normalise(fractal_noise(size, 3, 5, seed=113))
    # Marshmallows sind grundsaetzlich sehr matt; nur Zuckerkoerner glaenzen.
    rough = 0.94 - 0.22 * grain - 0.06 * patches * height
    encoded = np.clip(rough * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(encoded, mode="L")


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    height = build_height(SIZE)

    outputs = {
        # Albedo und Normal Map bleiben RGB, die Rauheit ist eine Graustufenkarte.
        "marshmallow-albedo.png": build_albedo(height, SIZE).quantize(
            colors=192, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.FLOYDSTEINBERG
        ),
        "marshmallow-normal.png": build_normal(height),
        "marshmallow-roughness.png": build_roughness(height, SIZE),
    }
    total = 0
    for name, image in outputs.items():
        path = OUTPUT / name
        image.save(path, optimize=True, compress_level=9)
        total += path.stat().st_size
        print(f"{path.relative_to(OUTPUT.parents[2])}  {path.stat().st_size / 1024:.0f} KiB")
    print(f"gesamt {total / 1024:.0f} KiB")


if __name__ == "__main__":
    main()
