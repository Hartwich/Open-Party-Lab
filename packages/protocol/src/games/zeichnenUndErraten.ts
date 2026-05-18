export type ZeichnenUndErratenWordCategory = "standard" | "adult";

export interface ZeichnenUndErratenLobbyCategoryOption {
  id: ZeichnenUndErratenWordCategory;
  label: string;
  description: string;
}

export interface ZeichnenUndErratenLobbyState {
  selectedCategory: ZeichnenUndErratenWordCategory;
  categories: ZeichnenUndErratenLobbyCategoryOption[];
}
