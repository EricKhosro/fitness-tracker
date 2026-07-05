"use client";

import { useTransition } from "react";
import { setWeightUnit } from "@/lib/actions/preferences";
import type { WeightUnit } from "@/lib/units";

export function UnitToggle({ unit }: { unit: WeightUnit }) {
  const [pending, startTransition] = useTransition();

  const choose = (u: WeightUnit) => {
    if (u !== unit) startTransition(() => setWeightUnit(u));
  };

  return (
    <div
      role="group"
      aria-label="Weight unit"
      className="inline-flex rounded-[3px] border border-[var(--color-rule)] bg-[var(--color-sheet)] p-0.5 font-mono text-xs"
    >
      {(["kg", "lb"] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => choose(u)}
          disabled={pending}
          aria-pressed={u === unit}
          className={`rounded-[2px] px-2.5 py-1 font-medium transition-colors disabled:opacity-50 ${
            u === unit
              ? "bg-[var(--color-ink)] text-[var(--color-sheet)]"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}
