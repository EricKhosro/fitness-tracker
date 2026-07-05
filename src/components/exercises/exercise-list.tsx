"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { deleteExercise } from "@/lib/actions/exercises";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatWeight, type WeightUnit } from "@/lib/units";
import type { ExerciseSummary } from "@/lib/queries/exercises";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const ALL = "All";

export function ExerciseList({
  exercises,
  unit,
}: {
  exercises: ExerciseSummary[];
  unit: WeightUnit;
}) {
  const [filter, setFilter] = useState<string>(ALL);

  // Distinct muscle groups present, in a stable order, plus an "Other" bucket.
  const groups = useMemo(() => {
    const set = new Set<string>();
    let hasOther = false;
    for (const e of exercises) {
      if (e.muscleGroup) set.add(e.muscleGroup);
      else hasOther = true;
    }
    const ordered = Array.from(set).sort();
    if (hasOther) ordered.push("Other");
    return ordered;
  }, [exercises]);

  const visible = exercises.filter((e) => {
    if (filter === ALL) return true;
    if (filter === "Other") return !e.muscleGroup;
    return e.muscleGroup === filter;
  });

  return (
    <div className="flex flex-col gap-4">
      {groups.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {[ALL, ...groups].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setFilter(g)}
              className={`rounded-[3px] px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                g === filter
                  ? "bg-[var(--color-ink)] text-[var(--color-sheet)]"
                  : "border border-[var(--color-rule)] text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="sheet p-0 sm:p-0">
        {visible.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-2 border-b border-[var(--color-rule-soft)] px-4 py-3 last:border-b-0 sm:px-5"
          >
            <Link
              href={`/dashboard/exercise/${e.id}`}
              className="group min-w-0 flex-1"
            >
              <p className="flex items-center gap-2 font-semibold group-hover:text-[var(--color-green)]">
                <span className="truncate">{e.name}</span>
                {e.muscleGroup ? (
                  <span className="tag shrink-0">{e.muscleGroup}</span>
                ) : null}
              </p>
              <p className="mt-0.5 font-mono text-xs text-[var(--color-muted)]">
                {e.totalSets} set{e.totalSets === 1 ? "" : "s"} ·{" "}
                {e.bestWeight != null
                  ? `best ${formatWeight(e.bestWeight, unit)}`
                  : "no data"}{" "}
                · last {formatDate(e.lastPerformedAt)}
              </p>
            </Link>
            <DeleteButton
              action={deleteExercise.bind(null, e.id)}
              confirmText={`Delete "${e.name}" and all its sets? This cannot be undone.`}
              label={`Delete ${e.name}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
