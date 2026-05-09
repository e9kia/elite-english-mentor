"use client";
// src/components/ThemeToggle.tsx
// Persists theme to localStorage and applies data-theme to <html>.

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "high-contrast";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) applyTheme(saved);
  }, []);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t === "dark" ? "" : t);
    localStorage.setItem("theme", t);
  };

  const toggle = () => applyTheme(theme === "dark" ? "high-contrast" : "dark");

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to High Contrast" : "Switch to Dark mode"}
      aria-label="Toggle theme"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
        "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {theme === "dark" ? (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM12 3v1m6.364 1.636l-.707.707M21 12h-1M17.657 17.657l-.707.707M12 20v1M6.343 17.657l-.707.707M4 12H3M6.343 6.343l-.707-.707" />
          </svg>
          <span className="hidden sm:inline">High Contrast</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span className="hidden sm:inline text-primary">Dark Mode</span>
        </>
      )}
    </button>
  );
}
