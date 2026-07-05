import Link from "next/link";
import { requireUserId } from "@/lib/dal";
import { getRoutines } from "@/lib/queries/routines";
import { deleteRoutine } from "@/lib/actions/routines";
import { DeleteButton } from "@/components/ui/delete-button";

export default async function RoutinesPage() {
  const userId = await requireUserId();
  const routines = await getRoutines(userId);

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <section>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          Routines
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Saved workouts you can start again in one tap.
        </p>
      </section>

      {routines.length === 0 ? (
        <div className="sheet py-8 text-center text-[var(--color-muted)]">
          No routines yet. Log a day of training, then open{" "}
          <Link
            href="/dashboard/workouts"
            className="font-medium text-[var(--color-green)] underline underline-offset-2 hover:text-[var(--color-green-deep)]"
          >
            Workouts
          </Link>{" "}
          and choose <span className="font-medium">“Save as routine”</span>.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {routines.map((r) => (
            <li key={r.id} className="sheet flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2 border-b border-[var(--color-rule)] pb-2">
                <h2 className="font-display text-lg font-semibold uppercase tracking-[0.06em]">
                  {r.name}
                </h2>
                <DeleteButton
                  action={deleteRoutine.bind(null, r.id)}
                  confirmText={`Delete the "${r.name}" routine? Your logged sets are kept.`}
                  label={`Delete ${r.name}`}
                />
              </div>
              <p className="text-sm text-[var(--color-muted)]">
                {r.exerciseNames.length > 0
                  ? r.exerciseNames.join(", ")
                  : "No exercises"}
              </p>
              <Link
                href={`/dashboard/routines/${r.id}`}
                className="btn btn-primary self-start px-4 py-2 text-sm"
              >
                Start workout
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
