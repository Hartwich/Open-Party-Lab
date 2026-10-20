import React from "react";
import {
  HUNTER_AVATAR_DEFS,
  getHunterAvatar,
  renderHunterAvatarSvg,
  type HunterAvatar,
} from "@open-party-lab/game-core";

export interface HunterAvatarData extends HunterAvatar {
  renderSvg: (size?: number) => React.ReactNode;
}

/**
 * React view over the shared Hunter avatar art.
 *
 * The faces and metadata live in `@open-party-lab/game-core` so the host shell
 * can render the same art as HTML strings; here we only wrap the SVG markup in
 * a React node via `dangerouslySetInnerHTML`.
 */
export const HUNTER_AVATARS: HunterAvatarData[] = HUNTER_AVATAR_DEFS.map((avatar) => ({
  ...avatar,
  renderSvg: (size = 48) => (
    <span
      style={{ display: "inline-flex", lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: renderHunterAvatarSvg(avatar.id, size) }}
    />
  ),
}));

export function getAvatarById(id: string): HunterAvatarData {
  const avatar = getHunterAvatar(id) ?? HUNTER_AVATAR_DEFS[0];
  return HUNTER_AVATARS.find((entry) => entry.id === avatar.id) ?? HUNTER_AVATARS[0];
}

/** Official Hunter Association Double-Wing Crest */
export function HunterAssociationSeal({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <circle cx="50" cy="50" r="46" fill="#0a1f18" stroke="#e8bd4f" strokeWidth="4" />
      <circle cx="50" cy="50" r="39" stroke="#35d07f" strokeWidth="1.5" strokeDasharray="4 2" />
      <path
        d="M26 30 C34 30, 44 42, 44 50 C44 58, 34 70, 26 70 C38 66, 42 56, 42 50 C42 44, 38 34, 26 30 Z"
        fill="#e8bd4f"
      />
      <path
        d="M74 30 C66 30, 56 42, 56 50 C56 58, 66 70, 74 70 C62 66, 58 56, 58 50 C58 44, 62 34, 74 30 Z"
        fill="#e8bd4f"
      />
      <polygon points="50,32 58,50 50,68 42,50" fill="#35d07f" stroke="#0a1f18" strokeWidth="2" />
      <circle cx="50" cy="50" r="3" fill="#ffffff" />
    </svg>
  );


}
