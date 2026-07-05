"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/lib/actions/types";

// A small button that runs a friend-related server action, with an optional
// confirm step and inline error reporting.
export function FriendActionButton({
  action,
  children,
  confirmText,
  variant = "ghost",
}: {
  action: () => Promise<ActionState | void>;
  children: React.ReactNode;
  confirmText?: string;
  variant?: "primary" | "ghost";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex items-center gap-2">
      {error ? (
        <span className="font-mono text-[10px] text-[var(--color-red)]">
          {error}
        </span>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          setError(null);
          startTransition(async () => {
            const result = await action();
            if (result?.error) setError(result.error);
          });
        }}
        className={`btn px-3 py-1.5 text-xs ${
          variant === "primary" ? "btn-primary" : "btn-ghost"
        }`}
      >
        {pending ? "…" : children}
      </button>
    </span>
  );
}
