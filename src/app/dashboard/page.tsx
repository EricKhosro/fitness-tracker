import Link from "next/link";
import { requireUserId, getWeightUnit } from "@/lib/dal";
import { getExerciseSummaries } from "@/lib/queries/exercises";
import { getRecentPrs } from "@/lib/queries/prs";
import { AddExerciseForm } from "@/components/exercises/add-exercise-form";
import { LogSetForm } from "@/components/sets/log-set-form";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { StarterButton } from "@/components/exercises/starter-button";
import { formatWeight } from "@/lib/units";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [exercises, prs, unit] = await Promise.all([
    getExerciseSummaries(userId),
    getRecentPrs(userId),
    getWeightUnit(),
  ]);

  const totalSets = exercises.reduce((sum, e) => sum + e.totalSets, 0);
  const heaviest = exercises.reduce(
    (max, e) => Math.max(max, e.bestWeight ?? 0),
    0,
  );
  const exerciseOptions = exercises.map((e) => ({ id: e.id, name: e.name }));

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
            Training log
          </h1>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-muted)]">
            {today}
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-3 divide-x divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          <Stat label="Exercises" value={exercises.length} />
          <Stat label="Sets logged" value={totalSets} />
          <Stat
            label="Heaviest lift"
            value={heaviest > 0 ? formatWeight(heaviest, unit) : "—"}
          />
        </dl>
      </section>

      {prs.length > 0 ? (
        <section>
          <h2 className="ledger-title mb-3">
            Recent PRs
            <span className="font-mono text-xs font-normal normal-case tracking-normal text-[var(--color-red)]">
              {prs.length} this month
            </span>
          </h2>
          <ul className="sheet p-0 sm:p-0">
            {prs.slice(0, 6).map((pr) => (
              <li
                key={pr.setId}
                className="flex items-center justify-between gap-3 border-b border-[var(--color-rule-soft)] px-4 py-3 last:border-b-0 sm:px-5"
              >
                <Link
                  href={`/dashboard/exercise/${pr.exerciseId}`}
                  className="min-w-0 truncate font-medium hover:text-[var(--color-green)]"
                >
                  {pr.exerciseName}
                </Link>
                <span className="flex shrink-0 items-center gap-2 font-mono text-sm">
                  <span className={pr.weightPr ? "pr-ring" : undefined}>
                    {formatWeight(pr.weight, unit)} × {pr.reps}
                  </span>
                  <span className="ink-note">
                    {pr.weightPr ? "PR" : "1RM PR"}
                  </span>
                  <span className="text-xs font-normal text-[var(--color-muted)]">
                    {pr.performedAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="ledger-title mb-3">Log a set</h2>
          <div className="sheet">
            <LogSetForm exercises={exerciseOptions} unit={unit} />
          </div>
        </section>

        <section>
          <h2 className="ledger-title mb-3">Add an exercise</h2>
          <div className="sheet">
            <AddExerciseForm existingNames={exercises.map((e) => e.name)} />
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              Pick a favorite like Squat, Deadlift or Pull-up — or add your own
              — then log sets against it.
            </p>
          </div>
        </section>
      </div>

      <section>
        <h2 className="ledger-title mb-3">Exercises</h2>
        {exercises.length === 0 ? (
          <div className="sheet flex flex-col items-center gap-4 py-8 text-center text-[var(--color-muted)]">
            <p>
              Nothing in the log yet. Add your first exercise above — or grab a
              starter set in one tap:
            </p>
            <StarterButton />
          </div>
        ) : (
          <ExerciseList exercises={exercises} unit={unit} />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="px-4 py-4 first:pl-0 sm:px-6">
      <dd className="font-mono text-2xl font-semibold tabular-nums sm:text-3xl">
        {value}
      </dd>
      <dt className="mt-1 font-display text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {label}
      </dt>
    </div>
  );
}
