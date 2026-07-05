import Link from "next/link";
import { requireUserId, getWeightUnit } from "@/lib/dal";
import { getWorkoutsByDay } from "@/lib/queries/workouts";
import { formatVolume } from "@/lib/units";
import { SaveRoutineButton } from "@/components/routines/save-routine-button";

function formatDay(date: string) {
  // date is "YYYY-MM-DD" — render in the local long format.
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function WorkoutsPage() {
  const userId = await requireUserId();
  const [days, unit] = await Promise.all([
    getWorkoutsByDay(userId),
    getWeightUnit(),
  ]);

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <section>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          Workouts
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Every training day, one page per date.
        </p>
      </section>

      {days.length === 0 ? (
        <div className="sheet py-8 text-center text-[var(--color-muted)]">
          No workouts on record.{" "}
          <Link
            href="/dashboard"
            className="font-medium text-[var(--color-green)] underline underline-offset-2 hover:text-[var(--color-green-deep)]"
          >
            Log your first set
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {days.map((day) => (
            <section key={day.date} className="sheet">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-rule)] pb-3">
                <h2 className="font-display text-lg font-semibold uppercase tracking-[0.06em]">
                  {formatDay(day.date)}
                </h2>
                <p className="font-mono text-xs text-[var(--color-muted)]">
                  {day.totalSets} set{day.totalSets === 1 ? "" : "s"} ·{" "}
                  {formatVolume(day.totalVolume, unit)} volume
                </p>
              </div>
              <ul className="flex flex-col divide-y divide-[var(--color-rule-soft)]">
                {day.exercises.map((ex) => (
                  <li
                    key={ex.name}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="min-w-0 truncate font-medium">
                      {ex.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-[var(--color-muted)]">
                      {ex.sets} × · {formatVolume(ex.volume, unit)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-end border-t border-[var(--color-rule)] pt-4">
                <SaveRoutineButton date={day.date} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
