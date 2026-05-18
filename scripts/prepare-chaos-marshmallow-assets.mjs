import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const jobs = [
  {
    input: path.join(repoRoot, "Temp", "ChaosKommando", "walk.png"),
    output: path.join(
      repoRoot,
      "apps",
      "host",
      "public",
      "chaos-kommando",
      "characters",
      "marshmallow-walk-a-clean.png"
    )
  },
  {
    input: path.join(repoRoot, "Temp", "ChaosKommando", "walk2.png"),
    output: path.join(
      repoRoot,
      "apps",
      "host",
      "public",
      "chaos-kommando",
      "characters",
      "marshmallow-walk-b-clean.png"
    )
  }
];

const backgroundSwatches = [
  [254, 254, 254],
  [240, 240, 240],
  [245, 245, 245],
  [231, 231, 231]
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function writePng(filePath, png) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

function colorDistance(r, g, b, swatch) {
  const dr = r - swatch[0];
  const dg = g - swatch[1];
  const db = b - swatch[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function minBackgroundDistance(r, g, b) {
  let best = Number.POSITIVE_INFINITY;

  for (const swatch of backgroundSwatches) {
    best = Math.min(best, colorDistance(r, g, b, swatch));
  }

  return best;
}

function isNeutralLightPixel(r, g, b) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const brightness = (r + g + b) / 3;

  return spread <= 10 && brightness >= 226;
}

function isBackgroundCandidate(r, g, b, strict) {
  const distance = minBackgroundDistance(r, g, b);

  if (strict) {
    return isNeutralLightPixel(r, g, b) && distance <= 22;
  }

  return isNeutralLightPixel(r, g, b) && distance <= 44;
}

function pixelIndex(width, x, y) {
  return (y * width + x) * 4;
}

function getPixel(png, x, y) {
  const index = pixelIndex(png.width, x, y);
  return [
    png.data[index],
    png.data[index + 1],
    png.data[index + 2],
    png.data[index + 3]
  ];
}

function setAlpha(png, x, y, alpha) {
  const index = pixelIndex(png.width, x, y);
  png.data[index + 3] = clamp(alpha, 0, 255);
}

function isTransparent(mask, width, x, y) {
  return mask[y * width + x] === 1;
}

function cleanWalkSheet(png) {
  const mask = new Uint8Array(png.width * png.height);
  const queue = [];

  function enqueue(x, y) {
    if (x < 0 || y < 0 || x >= png.width || y >= png.height) {
      return;
    }

    const maskIndex = y * png.width + x;

    if (mask[maskIndex] === 1) {
      return;
    }

    const [r, g, b, a] = getPixel(png, x, y);

    if (a === 0 || !isBackgroundCandidate(r, g, b, true)) {
      return;
    }

    mask[maskIndex] = 1;
    queue.push([x, y]);
  }

  for (let x = 0; x < png.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, png.height - 1);
  }

  for (let y = 0; y < png.height; y += 1) {
    enqueue(0, y);
    enqueue(png.width - 1, y);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const [x, y] = queue[index];
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ];

    for (const [nextX, nextY] of neighbors) {
      if (nextX < 0 || nextY < 0 || nextX >= png.width || nextY >= png.height) {
        continue;
      }

      const maskIndex = nextY * png.width + nextX;

      if (mask[maskIndex] === 1) {
        continue;
      }

      const [r, g, b, a] = getPixel(png, nextX, nextY);

      if (a === 0 || !isBackgroundCandidate(r, g, b, true)) {
        continue;
      }

      mask[maskIndex] = 1;
      queue.push([nextX, nextY]);
    }
  }

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (isTransparent(mask, png.width, x, y)) {
        setAlpha(png, x, y, 0);
      }
    }
  }

  for (let y = 1; y < png.height - 1; y += 1) {
    for (let x = 1; x < png.width - 1; x += 1) {
      if (isTransparent(mask, png.width, x, y)) {
        continue;
      }

      const [r, g, b, a] = getPixel(png, x, y);

      if (a === 0 || !isBackgroundCandidate(r, g, b, false)) {
        continue;
      }

      const touchesTransparent =
        isTransparent(mask, png.width, x + 1, y) ||
        isTransparent(mask, png.width, x - 1, y) ||
        isTransparent(mask, png.width, x, y + 1) ||
        isTransparent(mask, png.width, x, y - 1);

      if (!touchesTransparent) {
        continue;
      }

      const distance = minBackgroundDistance(r, g, b);
      const alpha = clamp(Math.round(((distance - 4) / 26) * 255), 0, 255);
      setAlpha(png, x, y, Math.min(a, alpha));
    }
  }

  return png;
}

for (const job of jobs) {
  const png = readPng(job.input);
  const cleaned = cleanWalkSheet(png);
  writePng(job.output, cleaned);
  console.log(`cleaned ${path.relative(repoRoot, job.output)}`);
}
