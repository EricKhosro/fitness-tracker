import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserId, getWeightUnit } from "@/lib/dal";
import { getExerciseWithSets, getProgression } from "@/lib/queries/exercises";
import { LogSetForm } from "@/components/sets/log-set-form";
import { ProgressionChart } from "@/components/exercises/progression-chart";
import { EditableSetRow } from "@/components/sets/editable-set-row";
import { RestTimer } from "@/components/sets/rest-timer";
import { fromKg, formatWeight, formatVolume } from "@/lib/units";
import { computePrFlags } from "@/lib/prs";

export default async function ExercisePage(
  props: PageProps<"/dashboard/exercise/[id]">,
) {
  const { id } = await props.params;
  const userId = await requireUserId();

  const [exercise, unit] = await Promise.all([
    getExerciseWithSets(userId, id),
    getWeightUnit(),
  ]);
  if (!exercise) {
    notFound();
  }

  const progressionKg = await getProgression(userId, id);
  // Convert the chart series into the user's display unit.
  const progression = progressionKg.map((p) => ({
    date: p.date,
    topWeight: fromKg(p.topWeight, unit),
    totalVolume: fromKg(p.totalVolume, unit),
    estimatedOneRepMax: fromKg(p.estimatedOneRepMax, unit),
  }));

  // Sets arrive chronologically, so the PR walk sees history in order.
  const prMap = computePrFlags(exercise.sets);

  const sets = [...exercise.sets].reverse(); // newest first for the table
  const last = exercise.sets[exercise.sets.length - 1];
  const lastSet = last
    ? { weight: fromKg(last.weight, unit), reps: last.reps }
    : undefined;

  const bestWeight = exercise.sets.reduce((max, s) => Math.max(max, s.weight), 0);
  const totalVolume = exercise.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div>
        <Link
          href="/dashboard"
          className="font-mono text-xs uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ← Training log
        </Link>
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          {exercise.name}
          {exercise.muscleGroup ? (
            <span className="tag text-xs">{exercise.muscleGroup}</span>
          ) : null}
        </h1>
        <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
          {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"} ·
          best {formatWeight(bestWeight, unit)} ·{" "}
          {formatVolume(totalVolume, unit)} total volume
        </p>
      </div>

      <section>
        <h2 className="ledger-title mb-3">Progression</h2>
        <div className="sheet">
          <ProgressionChart data={progression} unit={unit} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="ledger-title mb-3">Log a set</h2>
            <div className="sheet h-fit">
              <LogSetForm
                exercises={[]}
                defaultExerciseId={exercise.id}
                unit={unit}
                lastSet={lastSet}
              />
            </div>
          </section>

          <section>
            <h2 className="ledger-title mb-3">Rest timer</h2>
            <div className="sheet h-fit">
              <RestTimer />
            </div>
          </section>
        </div>

        <section>
          <h2 className="ledger-title mb-3">History</h2>
          <div className="sheet">
            {sets.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                No sets on record yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-[var(--color-rule-soft)]">
                {sets.map((s) => (
                  <EditableSetRow
                    key={s.id}
                    set={s}
                    unit={unit}
                    pr={prMap.get(s.id) ?? { weight: false, oneRm: false }}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
