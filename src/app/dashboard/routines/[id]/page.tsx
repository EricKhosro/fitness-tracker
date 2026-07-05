import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserId, getWeightUnit } from "@/lib/dal";
import { getRoutine } from "@/lib/queries/routines";
import { LogSetForm } from "@/components/sets/log-set-form";
import { RestTimer } from "@/components/sets/rest-timer";
import { fromKg } from "@/lib/units";

export default async function RoutinePage(
  props: PageProps<"/dashboard/routines/[id]">,
) {
  const { id } = await props.params;
  const userId = await requireUserId();

  const [routine, unit] = await Promise.all([
    getRoutine(userId, id),
    getWeightUnit(),
  ]);
  if (!routine) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div>
        <Link
          href="/dashboard/routines"
          className="font-mono text-xs uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ← Routines
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          {routine.name}
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          {routine.exercises.length} exercise
          {routine.exercises.length === 1 ? "" : "s"} — log your sets below.
        </p>
      </div>

      <section>
        <h2 className="ledger-title mb-3">Rest timer</h2>
        <div className="sheet">
          <RestTimer />
        </div>
      </section>

      {routine.exercises.length === 0 ? (
        <div className="sheet py-8 text-center text-[var(--color-muted)]">
          This routine has no exercises.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {routine.exercises.map((ex) => (
            <section key={ex.exerciseId} className="sheet">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-[var(--color-rule)] pb-2">
                <Link
                  href={`/dashboard/exercise/${ex.exerciseId}`}
                  className="group min-w-0"
                >
                  <h2 className="truncate font-display text-lg font-semibold uppercase tracking-[0.06em] group-hover:text-[var(--color-green)]">
                    {ex.name}
                  </h2>
                </Link>
                {ex.muscleGroup ? (
                  <span className="tag shrink-0">{ex.muscleGroup}</span>
                ) : null}
              </div>
              <LogSetForm
                exercises={[]}
                defaultExerciseId={ex.exerciseId}
                unit={unit}
                lastSet={
                  ex.lastSet
                    ? { weight: fromKg(ex.lastSet.weight, unit), reps: ex.lastSet.reps }
                    : undefined
                }
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
