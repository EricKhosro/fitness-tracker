"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Train" },
  { href: "/dashboard/workouts", label: "Workouts" },
  { href: "/dashboard/routines", label: "Routines" },
  { href: "/dashboard/body", label: "Body" },
  { href: "/dashboard/friends", label: "Friends" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {LINKS.map((l) => {
        const active =
          l.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`border-b-2 px-1.5 pb-1 pt-1.5 font-display text-sm font-semibold uppercase tracking-[0.08em] transition-colors sm:px-2 ${
              active
                ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
