"use client";

import { useState, useTransition } from "react";
import { updateSet, deleteSet } from "@/lib/actions/sets";
import type { ActionState } from "@/lib/actions/types";
import { DeleteButton } from "@/components/ui/delete-button";
import { PencilIcon } from "@/components/ui/icons";
import { fromKg, formatWeight, formatVolume, type WeightUnit } from "@/lib/units";

export type SetRow = {
  id: string;
  weight: number; // kg
  reps: number;
  notes: string | null;
  performedAt: Date | string;
};

export function EditableSetRow({
  set,
  unit,
  pr,
}: {
  set: SetRow;
  unit: WeightUnit;
  pr: { weight: boolean; oneRm: boolean };
}) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();

  function action(formData: FormData) {
    startTransition(async () => {
      const result = await updateSet(null, formData);
      setState(result);
      if (result?.ok) setEditing(false);
    });
  }

  const date = new Date(set.performedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (editing) {
    return (
      <li className="py-3 first:pt-0 last:pb-0">
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={set.id} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor={`w-${set.id}`}>
                Weight ({unit})
              </label>
              <input
                id={`w-${set.id}`}
                name="weight"
                type="number"
                step="0.5"
                min="0"
                inputMode="decimal"
                defaultValue={fromKg(set.weight, unit)}
                className="input font-mono"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor={`r-${set.id}`}>
                Reps
              </label>
              <input
                id={`r-${set.id}`}
                name="reps"
                type="number"
                step="1"
                min="1"
                inputMode="numeric"
                defaultValue={set.reps}
                className="input font-mono"
                required
              />
            </div>
          </div>
          <input
            name="notes"
            defaultValue={set.notes ?? ""}
            maxLength={280}
            placeholder="Notes (optional)"
            className="input"
          />
          {state?.error ? (
            <p className="font-mono text-xs text-[var(--color-red)]">
              {state.error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary px-3 py-1.5 text-xs"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn btn-ghost px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-sm font-semibold">
          {pr.weight ? (
            <span className="pr-ring">
              {formatWeight(set.weight, unit)} × {set.reps}
            </span>
          ) : (
            <span>
              {formatWeight(set.weight, unit)} × {set.reps}
            </span>
          )}
          {pr.weight ? <span className="ink-note">PR</span> : null}
          {!pr.weight && pr.oneRm ? (
            <span className="ink-note">1RM PR</span>
          ) : null}
          <span className="text-xs font-normal text-[var(--color-muted)]">
            {formatVolume(set.weight * set.reps, unit)} vol
          </span>
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
          <span className="font-mono">{date}</span>
          {set.notes ? ` · ${set.notes}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit set"
          className="rounded-[3px] p-2 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <DeleteButton
          action={deleteSet.bind(null, set.id)}
          confirmText="Delete this set?"
          label="Delete set"
        />
      </div>
    </li>
  );
}
