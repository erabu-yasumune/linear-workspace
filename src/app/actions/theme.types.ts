export const THEMES = ["black", "white"] as const;
export type ThemeKey = (typeof THEMES)[number];
