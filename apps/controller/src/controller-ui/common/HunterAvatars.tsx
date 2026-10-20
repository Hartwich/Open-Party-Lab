import React from "react";

export interface HunterAvatarData {
  id: string;
  name: string;
  title: string;
  nenType: string;
  nenKanji: string;
  color: string;
  accentColor: string;
  quote: string;
  badge: string;
  renderSvg: (size?: number) => React.ReactNode;
}

export const HUNTER_AVATARS: HunterAvatarData[] = [
  {
    id: "gon",
    name: "Gon Freecss",
    title: "Rookie Hunter",
    nenType: "Enhancer",
    nenKanji: "強化系",
    color: "#2ecc71",
    accentColor: "#f39c12",
    quote: "First comes Rock! Jajanken!",
    badge: "🎣",
    renderSvg: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" fill="#1b4d3e" stroke="#35d07f" strokeWidth="3" />
        <path d="M22 45 L30 14 L42 32 L50 8 L58 32 L70 14 L78 45 L85 30 L80 60 L20 60 L15 30 Z" fill="#0d2818" />
        <path d="M26 40 L32 18 L40 32 L50 14 L60 32 L68 18 L74 40 Z" fill="#35d07f" opacity="0.85" />
        <path d="M30 46 C30 70, 70 70, 70 46 Z" fill="#fed7aa" />
        <circle cx="40" cy="50" r="4.5" fill="#854d0e" />
        <circle cx="60" cy="50" r="4.5" fill="#854d0e" />
        <circle cx="41.5" cy="48.5" r="1.5" fill="#ffffff" />
        <circle cx="61.5" cy="48.5" r="1.5" fill="#ffffff" />
        <path d="M43 60 Q50 66 57 60" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M28 72 L50 88 L72 72 L78 100 L22 100 Z" fill="#166534" />
        <path d="M38 72 L50 82 L62 72 Z" fill="#fed7aa" />
        <circle cx="50" cy="90" r="3" fill="#eab308" />
      </svg>
    )
  },
  {
    id: "killua",
    name: "Killua Zoldyck",
    title: "Zoldyck Assassin",
    nenType: "Transmuter",
    nenKanji: "変化系",
    color: "#38bdf8",
    accentColor: "#93c5fd",
    quote: "Godspeed: Kanmuru!",
    badge: "⚡",
    renderSvg: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
        <path d="M18 48 C15 30, 25 10, 50 10 C75 10, 85 30, 82 48 L86 42 L80 62 L74 54 L66 66 L50 60 L34 66 L26 54 L20 62 Z" fill="#e2e8f0" />
        <path d="M28 35 L38 20 L48 30 L58 18 L68 32 L78 24 L74 46 Z" fill="#f8fafc" />
        <path d="M32 46 C32 68, 68 68, 68 46 Z" fill="#ffedd5" />
        <ellipse cx="40" cy="49" rx="5" ry="3.5" fill="#0284c7" />
        <ellipse cx="60" cy="49" rx="5" ry="3.5" fill="#0284c7" />
        <circle cx="41" cy="48" r="1.5" fill="#ffffff" />
        <circle cx="61" cy="48" r="1.5" fill="#ffffff" />
        <path d="M46 59 Q51 62 55 58" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M26 74 L50 86 L74 74 L80 100 L20 100 Z" fill="#334155" />
        <path d="M36 74 L50 82 L64 74 Z" fill="#64748b" />
        <path d="M78 22 L83 29 L79 30 L85 38 L80 34 L82 30 Z" fill="#38bdf8" />
      </svg>
    )
  },
  {
    id: "kurapika",
    name: "Kurapika",
    title: "Chain User",
    nenType: "Conjurer",
    nenKanji: "具現化系",
    color: "#e8bd4f",
    accentColor: "#ef4444",
    quote: "Judgment Chain: Dowsing Chain!",
    badge: "⛓️",
    renderSvg: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" fill="#1e1b4b" stroke="#e8bd4f" strokeWidth="3" />
        <path d="M24 45 C22 25, 34 14, 50 14 C66 14, 78 25, 76 45 L78 62 L70 54 L62 64 L50 58 L38 64 L30 54 L22 62 Z" fill="#fbbf24" />
        <path d="M30 38 L38 24 L48 35 L58 22 L68 36 L72 45 Z" fill="#fde047" />
        <path d="M32 46 C32 68, 68 68, 68 46 Z" fill="#ffedd5" />
        <ellipse cx="40" cy="50" rx="5" ry="3.5" fill="#dc2626" />
        <ellipse cx="60" cy="50" rx="5" ry="3.5" fill="#dc2626" />
        <circle cx="41.5" cy="48.5" r="1.5" fill="#ffffff" />
        <circle cx="61.5" cy="48.5" r="1.5" fill="#ffffff" />
        <line x1="46" y1="59" x2="54" y2="59" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        <path d="M26 74 L50 88 L74 74 L80 100 L20 100 Z" fill="#1e3a8a" />
        <path d="M30 74 L50 86 L70 74" stroke="#dc2626" strokeWidth="3" fill="none" />
        <circle cx="28" cy="54" r="2.5" fill="#e11d48" />
      </svg>
    )
  },
  {
    id: "hisoka",
    name: "Hisoka Morow",
    title: "Magician",
    nenType: "Transmuter",
    nenKanji: "変化系",
    color: "#ec4899",
    accentColor: "#a855f7",
    quote: "Bungee Gum has the properties of rubber & gum!",
    badge: "🃏",
    renderSvg: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" fill="#2e1065" stroke="#ec4899" strokeWidth="3" />
        <path d="M26 48 L22 28 L36 12 L50 6 L64 12 L78 28 L74 48 L80 34 L76 60 L24 60 Z" fill="#d946ef" />
        <path d="M32 38 L42 18 L50 12 L58 18 L68 38 Z" fill="#f472b6" />
        <path d="M30 46 C30 70, 70 70, 70 46 Z" fill="#f8fafc" />
        <path d="M35 48 Q40 45 45 49" stroke="#581c87" strokeWidth="2.5" fill="none" />
        <path d="M55 49 Q60 45 65 48" stroke="#581c87" strokeWidth="2.5" fill="none" />
        <circle cx="41" cy="48" r="2.5" fill="#eab308" />
        <circle cx="59" cy="48" r="2.5" fill="#eab308" />
        <polygon points="38,55 39,58 42,58 39.5,60 40.5,63 38,61 35.5,63 36.5,60 34,58 37,58" fill="#d946ef" />
        <path d="M60 55 C60 55, 57 58, 57 60 C57 62, 63 62, 63 60 C63 58, 60 55, 60 55 Z" fill="#06b6d4" />
        <path d="M42 62 Q50 68 58 61" stroke="#be185d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M26 74 L50 88 L74 74 L80 100 L20 100 Z" fill="#4a044e" />
        <polygon points="50,78 54,84 50,90 46,84" fill="#ec4899" />
      </svg>
    )
  },
  {
    id: "chrollo",
    name: "Chrollo Lucilfer",
    title: "Troupe Leader",
    nenType: "Specialist",
    nenKanji: "特質系",
    color: "#8b5cf6",
    accentColor: "#0f172a",
    quote: "Skill Hunter: Bandit's Secret!",
    badge: "🕷️",
    renderSvg: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" fill="#09090b" stroke="#8b5cf6" strokeWidth="3" />
        <path d="M24 46 C22 24, 34 12, 50 12 C66 12, 78 24, 76 46 L78 62 L22 62 Z" fill="#18181b" />
        <path d="M30 46 C30 68, 70 68, 70 46 Z" fill="#fef08a" opacity="0.9" />
        <line x1="50" y1="36" x2="50" y2="46" stroke="#09090b" strokeWidth="2.5" />
        <line x1="45" y1="41" x2="55" y2="41" stroke="#09090b" strokeWidth="2.5" />
        <circle cx="40" cy="51" r="3.5" fill="#09090b" />
        <circle cx="60" cy="51" r="3.5" fill="#09090b" />
        <circle cx="41" cy="50" r="1" fill="#ffffff" />
        <circle cx="61" cy="50" r="1" fill="#ffffff" />
        <line x1="45" y1="60" x2="55" y2="60" stroke="#52525b" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 74 C34 68, 66 68, 76 74 L82 100 L18 100 Z" fill="#27272a" />
        <path d="M22 72 Q36 64 50 72 Q64 64 78 72 L72 82 Q50 76 28 82 Z" fill="#e4e4e7" />
        <circle cx="28" cy="55" r="3" fill="#38bdf8" />
        <circle cx="72" cy="55" r="3" fill="#38bdf8" />
      </svg>
    )
  },
  {
    id: "leorio",
    name: "Leorio Paradinight",
    title: "Doctor Candidate",
    nenType: "Emitter",
    nenKanji: "放出系",
    color: "#f97316",
    accentColor: "#1e3a8a",
    quote: "Remote Punch: Teleporting Strike!",
    badge: "💼",
    renderSvg: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" fill="#172554" stroke="#f97316" strokeWidth="3" />
        <path d="M26 44 L32 18 L50 14 L68 18 L74 44 Z" fill="#1c1917" />
        <path d="M30 44 C30 70, 70 70, 70 44 Z" fill="#fed7aa" />
        <rect x="34" y="46" width="13" height="9" rx="2" fill="#0f172a" stroke="#71717a" strokeWidth="1.5" />
        <rect x="53" y="46" width="13" height="9" rx="2" fill="#0f172a" stroke="#71717a" strokeWidth="1.5" />
        <line x1="47" y1="50" x2="53" y2="50" stroke="#71717a" strokeWidth="2" />
        <path d="M43 62 Q50 67 57 62" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M24 74 L50 86 L76 74 L82 100 L18 100 Z" fill="#1e293b" />
        <polygon points="50,74 54,82 50,96 46,82" fill="#ef4444" />
        <polygon points="46,74 50,80 54,74" fill="#ffffff" />
      </svg>
    )
  },
  {
    id: "bisky",
    name: "Biscuit Krueger",
    title: "Nen Grandmaster",
    nenType: "Transmuter",
    nenKanji: "変化系",
    color: "#f43f5e",
    accentColor: "#fbbf24",
    quote: "Magical Spa Services & True Strength!",
    badge: "🎀",
    renderSvg: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" fill="#4c0519" stroke="#f43f5e" strokeWidth="3" />
        <circle cx="22" cy="38" r="14" fill="#fbbf24" />
        <circle cx="78" cy="38" r="14" fill="#fbbf24" />
        <path d="M28 44 C26 24, 36 14, 50 14 C64 14, 74 24, 72 44 Z" fill="#fde047" />
        <path d="M20 28 L28 32 L22 36 Z" fill="#f43f5e" />
        <path d="M80 28 L72 32 L78 36 Z" fill="#f43f5e" />
        <path d="M32 44 C32 68, 68 68, 68 44 Z" fill="#ffedd5" />
        <ellipse cx="40" cy="49" rx="4.5" ry="5.5" fill="#38bdf8" />
        <ellipse cx="60" cy="49" rx="4.5" ry="5.5" fill="#38bdf8" />
        <circle cx="39" cy="47" r="1.5" fill="#ffffff" />
        <circle cx="59" cy="47" r="1.5" fill="#ffffff" />
        <circle cx="42" cy="52" r="1" fill="#ffffff" />
        <circle cx="62" cy="52" r="1" fill="#ffffff" />
        <ellipse cx="34" cy="56" rx="3" ry="1.5" fill="#fda4af" />
        <ellipse cx="66" cy="56" rx="3" ry="1.5" fill="#fda4af" />
        <path d="M45 58 Q50 62 55 58" stroke="#be123c" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M26 74 L50 86 L74 74 L80 100 L20 100 Z" fill="#e11d48" />
        <path d="M38 74 Q50 82 62 74" fill="#ffffff" />
      </svg>
    )
  },
  {
    id: "netero",
    name: "Isaac Netero",
    title: "12th Chairman",
    nenType: "Enhancer",
    nenKanji: "強化系",
    color: "#eab308",
    accentColor: "#f8fafc",
    quote: "100-Type Guanyin Bodhisattva!",
    badge: "🙏",
    renderSvg: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" fill="#18181b" stroke="#eab308" strokeWidth="3" />
        <ellipse cx="50" cy="16" rx="6" ry="8" fill="#e4e4e7" />
        <circle cx="50" cy="42" r="22" fill="#fed7aa" />
        <path d="M34 38 Q42 32 46 38" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M66 38 Q58 32 54 38" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
        <line x1="38" y1="44" x2="45" y2="43" stroke="#451a03" strokeWidth="2.5" />
        <line x1="55" y1="43" x2="62" y2="44" stroke="#451a03" strokeWidth="2.5" />
        <path d="M42 50 Q50 56 58 50 L56 72 Q50 84 44 72 Z" fill="#ffffff" />
        <circle cx="50" cy="42" r="28" stroke="#eab308" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
        <path d="M24 74 L50 86 L76 74 L82 100 L18 100 Z" fill="#0f172a" />
        <path d="M38 74 L50 84 L62 74" stroke="#eab308" strokeWidth="3" fill="none" />
      </svg>
    )
  },
  {
    id: "ging",
    name: "Ging Freecss",
    title: "Double-Star Ruins Hunter",
    nenType: "Specialist",
    nenKanji: "特質系",
    color: "#059669",
    accentColor: "#d97706",
    quote: "Enjoy the little detours to the fullest!",
    badge: "🐗",
    renderSvg: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" fill="#064e3b" stroke="#059669" strokeWidth="3" />
        <path d="M22 36 C22 18, 40 10, 50 10 C60 10, 78 18, 78 36 L80 44 L20 44 Z" fill="#78350f" />
        <path d="M20 32 Q50 40 80 32 L82 42 Q50 50 18 42 Z" fill="#92400e" />
        <path d="M18 44 L12 50 L20 54 L16 62 L26 58 Z" fill="#18181b" />
        <path d="M82 44 L88 50 L80 54 L84 62 L74 58 Z" fill="#18181b" />
        <path d="M28 44 C28 68, 72 68, 72 44 Z" fill="#fed7aa" />
        <path d="M38 64 Q50 69 62 64" stroke="#78350f" strokeWidth="2.5" strokeDasharray="1.5 1.5" fill="none" />
        <ellipse cx="40" cy="50" rx="4" ry="3.5" fill="#451a03" />
        <ellipse cx="60" cy="50" rx="4" ry="3.5" fill="#451a03" />
        <circle cx="41.5" cy="49" r="1.2" fill="#ffffff" />
        <circle cx="61.5" cy="49" r="1.2" fill="#ffffff" />
        <path d="M43 58 Q50 63 57 58" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M22 74 L50 88 L78 74 L84 100 L16 100 Z" fill="#365314" />
        <path d="M32 74 L50 84 L68 74" stroke="#d97706" strokeWidth="2.5" fill="none" />
      </svg>
    )
  },
  {
    id: "meruem",
    name: "King Meruem",
    title: "Chimera Ant Sovereign",
    nenType: "Specialist",
    nenKanji: "特質系",
    color: "#10b981",
    accentColor: "#a855f7",
    quote: "You have no idea what humans are capable of.",
    badge: "👑",
    renderSvg: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" fill="#022c22" stroke="#10b981" strokeWidth="3" />
        <path d="M26 44 C24 16, 40 8, 50 8 C60 8, 76 16, 74 44 L78 52 L22 52 Z" fill="#047857" />
        <ellipse cx="50" cy="22" rx="16" ry="6" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />
        <circle cx="20" cy="50" r="7" fill="#047857" stroke="#10b981" strokeWidth="2" />
        <circle cx="80" cy="50" r="7" fill="#047857" stroke="#10b981" strokeWidth="2" />
        <path d="M30 46 C30 70, 70 70, 70 46 Z" fill="#a7f3d0" />
        <ellipse cx="40" cy="50" rx="5" ry="3.5" fill="#7e22ce" />
        <ellipse cx="60" cy="50" rx="5" ry="3.5" fill="#7e22ce" />
        <circle cx="41.5" cy="48.5" r="1.5" fill="#f3e8ff" />
        <circle cx="61.5" cy="48.5" r="1.5" fill="#f3e8ff" />
        <line x1="44" y1="62" x2="56" y2="62" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M26 74 L50 88 L74 74 L80 100 L20 100 Z" fill="#064e3b" />
        <path d="M36 74 L50 84 L64 74" stroke="#a855f7" strokeWidth="2.5" fill="none" />
      </svg>
    )
  }
];

export function getAvatarById(id: string): HunterAvatarData {
  return HUNTER_AVATARS.find((a) => a.id === id) || HUNTER_AVATARS[0];
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
