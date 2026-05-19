export const THEME_STORAGE_KEY = "pawfect-theme";

export type ThemePreference = "light" | "dark" | "system";

export function resolveDarkMode(preference: ThemePreference): boolean {
  if (preference === "dark") {
    return true;
  }
  if (preference === "light") {
    return false;
  }
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "system";
}

export function applyTheme(preference: ThemePreference): boolean {
  const dark = resolveDarkMode(preference);
  document.documentElement.classList.toggle("dark", dark);
  return dark;
}

export function persistTheme(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // ignore
  }
}
