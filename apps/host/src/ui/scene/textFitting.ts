import Phaser from "phaser";

/** Shortens a string from the middle, keeping both ends readable (URLs, IDs). */
export function trimMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const visibleChars = Math.max(8, maxLength - 3);
  const left = Math.ceil(visibleChars / 2);
  const right = Math.floor(visibleChars / 2);
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

/** Drops trailing words until the rendered text fits the given height. */
export function fitTextToHeight(
  textObject: Phaser.GameObjects.Text,
  fullText: string,
  maxHeight: number
): void {
  if (textObject.height <= maxHeight) {
    return;
  }

  const words = fullText.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return;
  }

  for (let wordCount = words.length - 1; wordCount > 0; wordCount -= 1) {
    textObject.setText(`${words.slice(0, wordCount).join(" ")}...`);

    if (textObject.height <= maxHeight) {
      return;
    }
  }

  textObject.setText(`${words[0]}...`);
}

function textFitsBox(
  textObject: Phaser.GameObjects.Text,
  maxWidth: number,
  maxHeight: number
): boolean {
  return textObject.width <= maxWidth + 0.5 && textObject.height <= maxHeight + 0.5;
}

/**
 * Fits text into a box, first by dropping words and then, if a single word is
 * still too long, by truncating characters.
 */
export function fitTextToBox(
  textObject: Phaser.GameObjects.Text,
  fullText: string,
  maxWidth: number,
  maxHeight: number
): void {
  const boxWidth = Math.max(12, Math.floor(maxWidth));
  const boxHeight = Math.max(12, Math.floor(maxHeight));

  textObject.setWordWrapWidth(boxWidth, true);
  textObject.setText(fullText);

  if (textFitsBox(textObject, boxWidth, boxHeight)) {
    return;
  }

  const words = fullText.split(/\s+/).filter(Boolean);

  if (words.length > 1) {
    for (let wordCount = words.length - 1; wordCount > 0; wordCount -= 1) {
      textObject.setText(`${words.slice(0, wordCount).join(" ")}...`);

      if (textFitsBox(textObject, boxWidth, boxHeight)) {
        return;
      }
    }
  }

  for (let characterCount = fullText.length - 1; characterCount > 0; characterCount -= 1) {
    const candidate = `${fullText.slice(0, characterCount).trimEnd()}...`;

    textObject.setText(candidate);

    if (textFitsBox(textObject, boxWidth, boxHeight)) {
      return;
    }
  }

  textObject.setText("...");
}

/** Parses a `#rrggbb` player colour into Phaser's numeric form. */
export function parseColor(input: string | null | undefined, fallback: number): number {
  if (!input) {
    return fallback;
  }

  const normalized = input.startsWith("#") ? input.slice(1) : input;
  const parsed = Number.parseInt(normalized, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}
