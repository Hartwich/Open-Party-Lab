import type { SupportedLanguage } from "./language.js";

export type LocalizedTextMap<T> = Record<SupportedLanguage, T>;

export interface LocalizedGameText {
  displayName: string;
  description: string;
  lobbySetup?: {
    title?: string;
    fields?: Readonly<Record<string, { label: string; description?: string }>>;
  };
}

export type LocalizedGameTextMap = LocalizedTextMap<LocalizedGameText>;
