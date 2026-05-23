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

export function ap3kFormControlClass(kind: "input" | "textarea" | "select" = "input") {
  if (kind === "textarea") return "ap3k-textarea";
  if (kind === "select") return "ap3k-select";
  return "ap3k-input";
}
