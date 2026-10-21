"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import {
  applyTheme,
  persistTheme,
  readStoredTheme,
  type ThemePreference,
} from "@/lib/theme";

export function ThemeToggle(): React.ReactElement {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(applyTheme(readStoredTheme()));
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
      className="rounded-full border border-stone-200/60 p-2 text-stone-600 hover:bg-stone-100 dark:border-stone-600/50 dark:text-stone-300 dark:hover:bg-stone-800"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
