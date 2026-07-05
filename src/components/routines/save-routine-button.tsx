"use client";

import { useState, useTransition } from "react";
import { saveRoutineFromDay } from "@/lib/actions/routines";
import type { ActionState } from "@/lib/actions/types";

export function SaveRoutineButton({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();

  function action(formData: FormData) {
    startTransition(async () => {
      const result = await saveRoutineFromDay(null, formData);
      setState(result);
      if (result?.ok) setOpen(false);
    });
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        {state?.ok ? (
          <span className="font-mono text-xs text-[var(--color-green)]">
            Saved as routine ✓
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setState(null);
          }}
          className="btn btn-ghost px-3 py-1.5 text-xs"
        >
          Save as routine
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex w-full flex-col gap-2">
      <input type="hidden" name="date" value={date} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="name"
          className="input"
          placeholder="Name this workout — e.g. Push Day"
          maxLength={60}
          autoFocus
          required
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn btn-primary shrink-0"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn btn-ghost shrink-0"
          >
            Cancel
          </button>
        </div>
      </div>
      {state?.error ? (
        <p className="font-mono text-xs text-[var(--color-red)]">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
