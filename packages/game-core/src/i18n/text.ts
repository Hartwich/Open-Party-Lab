import type { SupportedLanguage } from "./language.js";

export type LocalizedTextMap<T> = Record<SupportedLanguage, T>;

export interface LocalizedSetupOptionText {
  label?: string;
  description?: string;
}

export interface LocalizedSetupFieldText extends LocalizedSetupOptionText {
  group?: string;
  options?: Readonly<Record<string, LocalizedSetupOptionText>>;
}

export interface LocalizedGameText {
  displayName: string;
  description: string;
  lobbySetup?: {
    title?: string;
    description?: string;
    fields?: Readonly<Record<string, LocalizedSetupFieldText>>;
    confirmation?: LocalizedSetupOptionText;
  };
  playerSetup?: {
    shuffleLabel?: string;
    title?: string;
    description?: string;
    readyBlockedLabel?: string;
    options?: Readonly<Record<string, {
      name?: string;
      title?: string;
      archetype?: string;
      description?: string;
    }>>;
  };
  visual?: {
    eyebrow?: string;
  };
}

export type LocalizedGameTextMap = LocalizedTextMap<LocalizedGameText>;
