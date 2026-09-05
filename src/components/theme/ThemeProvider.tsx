"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { THEME_STORAGE_KEY } from "./constants";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * ThemeProvider — mounted once in the root layout, alongside the inline
 * no-flash script (see layout.tsx) that sets `data-theme` on <html> before
 * React ever hydrates. That script is what actually prevents a flash of
 * the wrong theme; this provider's initial `useState` just mirrors
 * whatever the DOM already has so React's notion of "current theme"
 * matches it from the first render, rather than being the source of truth
 * itself. The CSS in globals.css does the actual re-coloring — this class
 * only toggles one DOM attribute and persists the choice.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === "undefined") return "dark";
    const attr = document.documentElement.getAttribute("data-theme");
    return attr === "light" ? "light" : "dark";
  });

  function setTheme(next: Theme) {
    setThemeState(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage disabled/full/private-browsing — theme still applies for this
      // session via the DOM attribute above, it just won't persist.
    }
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
