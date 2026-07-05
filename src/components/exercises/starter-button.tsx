"use client";

import { useTransition } from "react";
import { addStarterExercises } from "@/lib/actions/exercises";

export function StarterButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => addStarterExercises())}
      className="btn btn-primary"
    >
      {pending ? "Adding…" : "Add 6 starter exercises"}
    </button>
  );
}
