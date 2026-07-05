"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { logBodyMetric } from "@/lib/actions/body";
import type { ActionState } from "@/lib/actions/types";
import type { WeightUnit } from "@/lib/units";
import { BODY_KINDS } from "@/lib/body-metrics";

export function BodyMetricForm({ unit }: { unit: WeightUnit }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    logBodyMetric,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState("bodyweight");

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const valueUnit = kind === "bodyweight" ? unit : "cm";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="kind">
            Measurement
          </label>
          <select
            id="kind"
            name="kind"
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {BODY_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="value">
            Value ({valueUnit})
          </label>
          <input
            id="value"
            name="value"
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
            className="input font-mono"
            placeholder={kind === "bodyweight" ? "75" : "90"}
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
          placeholder="Morning, fasted"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Log measurement"}
      </button>

      {state?.error ? (
        <p className="font-mono text-xs text-[var(--color-red)]">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="font-mono text-xs text-[var(--color-green)]">Saved ✓</p>
      ) : null}
    </form>
  );
}
