"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("letsgo-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

useEffect(() => {
  const root = document.documentElement;

  // falls du data-theme nutzt: beibehalten
  root.setAttribute("data-theme", theme);

  // WICHTIG: Tailwind dark: braucht die class "dark"
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}, [theme]);


  const toggleTheme = () => setTheme((p) => (p === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
