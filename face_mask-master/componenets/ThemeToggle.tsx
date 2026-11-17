"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/componenets/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle${isDark ? " theme-toggle--dark" : ""}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <SunIcon className="theme-toggle__sun" aria-hidden="true" />
      <MoonIcon className="theme-toggle__moon" aria-hidden="true" />
      <span className="theme-toggle__orb" aria-hidden="true" />
    </button>
  );
}
