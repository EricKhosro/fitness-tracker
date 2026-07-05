"use client";

import { useActionState, useEffect, useRef } from "react";
import { logSet } from "@/lib/actions/sets";
import type { ActionState } from "@/lib/actions/types";
import type { WeightUnit } from "@/lib/units";

type ExerciseOption = { id: string; name: string };

export function LogSetForm({
  exercises,
  defaultExerciseId,
  unit,
  lastSet,
}: {
  exercises: ExerciseOption[];
  defaultExerciseId?: string;
  unit: WeightUnit;
  // Previous set for this exercise, already converted to the display unit.
  lastSet?: { weight: number; reps: number };
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    logSet,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      const form = formRef.current;
      form?.reset();
      // Let the rest timer (if present) kick off automatically.
      window.dispatchEvent(new CustomEvent("replog:set-logged"));
    }
  }, [state]);

  if (exercises.length === 0 && !defaultExerciseId) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        Add an exercise first, then you can start logging sets.
      </p>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const repeatLast = () => {
    const form = formRef.current;
    if (!form || !lastSet) return;
    (form.elements.namedItem("weight") as HTMLInputElement).value = String(
      lastSet.weight,
    );
    (form.elements.namedItem("reps") as HTMLInputElement).value = String(
      lastSet.reps,
    );
  };

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {!defaultExerciseId ? (
        <div>
          <label className="label" htmlFor="exerciseId">
            Exercise
          </label>
          <select id="exerciseId" name="exerciseId" className="input" required>
            {exercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="exerciseId" value={defaultExerciseId} />
      )}

      {lastSet ? (
        <button
          type="button"
          onClick={repeatLast}
          className="self-start rounded-[3px] border border-[var(--color-rule)] px-3 py-1.5 font-mono text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
        >
          ↺ Last set: {lastSet.weight} {unit} × {lastSet.reps}
        </button>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="weight">
            Weight ({unit})
          </label>
          <input
            id="weight"
            name="weight"
            type="number"
            step="0.5"
            min="0"
            inputMode="decimal"
            className="input font-mono"
            placeholder={unit === "kg" ? "60" : "135"}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="reps">
            Reps
          </label>
          <input
            id="reps"
            name="reps"
            type="number"
            step="1"
            min="1"
            inputMode="numeric"
            className="input font-mono"
            placeholder="8"
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="performedAt">
          Date
        </label>
        <input
          id="performedAt"
          name="performedAt"
          type="date"
          defaultValue={today}
          className="input font-mono"
        />
      </div>

      <div>
        <label className="label" htmlFor="notes">
          Notes (optional)
        </label>
        <input
          id="notes"
          name="notes"
          className="input"
          maxLength={280}
          placeholder="Felt strong, last set was a grind"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Logging…" : "Log set"}
      </button>

      {state?.error ? (
        <p className="font-mono text-xs text-[var(--color-red)]">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="font-mono text-xs text-[var(--color-green)]">
          Set logged ✓
        </p>
      ) : null}
    </form>
  );
}
