"use client";

import { useActionState } from "react";
import { setUsername } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/types";

export function UsernameForm({ username }: { username: string | null }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    setUsername,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="label" htmlFor="username">
          Username
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[var(--color-muted)]">
              @
            </span>
            <input
              id="username"
              name="username"
              className="input pl-7 font-mono lowercase"
              defaultValue={username ?? ""}
              placeholder="your_handle"
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9_]{3,20}"
              title="3–20 characters: letters, numbers and underscores"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary shrink-0"
            disabled={pending}
          >
            {pending ? "Saving…" : username ? "Change" : "Claim"}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Friends find you by this handle. Lowercase letters, numbers and
          underscores only.
        </p>
      </div>
      {state?.error ? (
        <p className="font-mono text-xs text-[var(--color-red)]">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="font-mono text-xs text-[var(--color-green)]">
          Username saved ✓
        </p>
      ) : null}
    </form>
  );
}
