"use client";

import { useTransition } from "react";
import { TrashIcon } from "@/components/ui/icons";

export function DeleteButton({
  action,
  confirmText,
  label = "Delete",
}: {
  action: () => Promise<void>;
  confirmText: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText)) {
          startTransition(() => action());
        }
      }}
      className="rounded-[3px] p-2 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-red)] disabled:opacity-50"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
