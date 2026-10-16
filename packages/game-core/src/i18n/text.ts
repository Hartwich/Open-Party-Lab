import type { SupportedLanguage } from "./language.js";

export type LocalizedTextMap<T> = Record<SupportedLanguage, T>;

export interface LocalizedLobbySetupOptionText {
  label: string;
  description?: string;
}

export interface LocalizedLobbySetupFieldText {
  label: string;
  description?: string;
  group?: string;
  options?: Readonly<Record<string, LocalizedLobbySetupOptionText>>;
}

export interface LocalizedPlayerSetupOptionText {
  name: string;
  title?: string;
  archetype?: string;
  description?: string;
}

export interface LocalizedGameText {
  displayName: string;
  description: string;
  lobbySetup?: {
    title?: string;
    description?: string;
    fields?: Readonly<Record<string, LocalizedLobbySetupFieldText>>;
    confirmation?: {
      label?: string;
      description?: string;
    };
  };
  playerSetup?: {
    title?: string;
    description?: string;
    readyBlockedLabel?: string;
    options?: Readonly<Record<string, LocalizedPlayerSetupOptionText>>;
  };
}

export type LocalizedGameTextMap = LocalizedTextMap<LocalizedGameText>;
