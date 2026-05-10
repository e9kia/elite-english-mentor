"use client";
// src/components/ThemeToggle.tsx
// Persists theme to localStorage and applies data-theme to <html>.

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) applyTheme(saved);
  }, []);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t === "light" ? "" : t);
    localStorage.setItem("theme", t);
  };

  const toggle = () => applyTheme(theme === "light" ? "dark" : "light");

  return (
    <button
      onClick={toggle}
      title={theme === "light" ? "Switch to Dark mode" : "Switch to Light mode"}
      aria-label="Toggle theme"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
        "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {theme === "light" ? (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span className="hidden sm:inline">Dark Mode</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="hidden sm:inline text-primary">Light Mode</span>
        </>
      )}
    </button>
  );
}

