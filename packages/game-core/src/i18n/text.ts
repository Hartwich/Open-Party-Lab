import type { SupportedLanguage } from "./language.js";

export type LocalizedTextMap<T> = Record<SupportedLanguage, T>;

export interface LocalizedGameText {
  displayName: string;
  description: string;
}

export type LocalizedGameTextMap = LocalizedTextMap<LocalizedGameText>;
