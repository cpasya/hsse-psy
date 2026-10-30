"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const storageKey = "hsse-theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const nextDark = !dark;
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.classList.toggle("light", !nextDark);
    localStorage.setItem(storageKey, nextDark ? "dark" : "light");
    setDark(nextDark);
  }

  return (
    <button
      className="icon-btn"
      aria-label={dark ? "Gunakan mode terang" : "Gunakan mode gelap"}
      aria-pressed={dark}
      onClick={toggleTheme}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
