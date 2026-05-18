export type ThemeMode = "light" | "dark" | "system";

export function normalizeThemeMode(value?: string | null): ThemeMode {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

export function nextThemeMode(current?: string | null): ThemeMode {
  const mode = normalizeThemeMode(current);
  if (mode === "dark") return "light";
  if (mode === "light") return "system";
  return "dark";
}
