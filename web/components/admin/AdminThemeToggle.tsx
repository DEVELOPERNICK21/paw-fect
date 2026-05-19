"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import {
  applyTheme,
  persistTheme,
  readStoredTheme,
  type ThemePreference,
} from "@/lib/theme";

export function AdminThemeToggle(): React.ReactElement {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const preference = readStoredTheme();
    setDark(applyTheme(preference));
    setMounted(true);
  }, []);

  const toggle = (): void => {
    const nextPreference: ThemePreference = dark ? "light" : "dark";
    persistTheme(nextPreference);
    setDark(applyTheme(nextPreference));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg border border-stone-200 bg-white p-2 text-stone-600 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mounted ? (
        dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />
      ) : (
        <Moon className="h-5 w-5 opacity-50" aria-hidden />
      )}
    </button>
  );
}
