"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { createExercise } from "@/lib/actions/exercises";
import type { ActionState } from "@/lib/actions/types";
import { FAVORITE_EXERCISES } from "@/lib/favorite-exercises";

// Sentinel value for the "type my own" option in the favorites dropdown.
const CUSTOM = "__custom__";

export function AddExerciseForm({
  existingNames = [],
}: {
  existingNames?: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"favorite" | "custom">("favorite");
  const [state, setState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();

  // Lowercased set of exercises the user already has, so we can disable them.
  const existing = useMemo(
    () => new Set(existingNames.map((n) => n.trim().toLowerCase())),
    [existingNames],
  );

  function action(formData: FormData) {
    startTransition(async () => {
      const result = await createExercise(null, formData);
      setState(result);
      if (result?.ok) {
        formRef.current?.reset();
        setMode("favorite");
      }
    });
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div>
        <label className="label" htmlFor="exercise-name">
          {mode === "custom" ? "Custom exercise" : "Choose an exercise"}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {mode === "favorite" ? (
            <select
              id="exercise-name"
              name="name"
              className="input"
              defaultValue=""
              required
              onChange={(e) => {
                if (e.target.value === CUSTOM) setMode("custom");
              }}
            >
              <option value="" disabled>
                Select a favorite…
              </option>
              {FAVORITE_EXERCISES.map((grp) => (
                <optgroup key={grp.group} label={grp.group}>
                  {grp.exercises.map((name) => {
                    const added = existing.has(name.toLowerCase());
                    return (
                      <option key={name} value={name} disabled={added}>
                        {added ? `${name} · added` : name}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
              <optgroup label="Other">
                <option value={CUSTOM}>Custom exercise…</option>
              </optgroup>
            </select>
          ) : (
            <input
              id="exercise-name"
              name="name"
              className="input"
              placeholder="e.g. Bench Press"
              maxLength={60}
              autoFocus
              required
            />
          )}
          <button
            type="submit"
            className="btn btn-primary shrink-0"
            disabled={pending}
          >
            {pending ? "Adding…" : "Add"}
          </button>
        </div>
        {mode === "custom" ? (
          <button
            type="button"
            onClick={() => setMode("favorite")}
            className="mt-2 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            ← Pick from favorites
          </button>
        ) : null}
      </div>
      {state?.error ? (
        <p className="font-mono text-xs text-[var(--color-red)]">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="font-mono text-xs text-[var(--color-green)]">
          Exercise added ✓
        </p>
      ) : null}
    </form>
  );
}
