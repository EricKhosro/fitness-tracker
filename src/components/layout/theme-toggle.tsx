"use client";

import { MoonIcon, SunIcon } from "@/components/ui/icons";

const KEY = "replog-theme";

export function ThemeToggle() {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem(KEY, dark ? "dark" : "light");
    } catch {
      /* storage unavailable — theme just won't persist */
    }
  };

  // Both icons are rendered and CSS picks one, so the markup is identical on
  // the server and the client regardless of the active theme.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark theme"
      className="rounded-[3px] border border-[var(--color-rule)] p-2 text-[var(--color-muted)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
    >
      <MoonIcon className="h-4 w-4 dark:hidden" />
      <SunIcon className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
