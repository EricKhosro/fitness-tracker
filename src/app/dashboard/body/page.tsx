import { requireUserId, getWeightUnit } from "@/lib/dal";
import { getAllBodyMetrics } from "@/lib/queries/body";
import { deleteBodyMetric } from "@/lib/actions/body";
import { BodyMetricForm } from "@/components/body/body-metric-form";
import { BodyChart } from "@/components/body/body-chart";
import { DeleteButton } from "@/components/ui/delete-button";
import { fromKg } from "@/lib/units";
import { BODY_KINDS } from "@/lib/body-metrics";

const LABELS = new Map(BODY_KINDS.map((k) => [k.value as string, k.label]));

export default async function BodyPage() {
  const userId = await requireUserId();
  const [entries, unit] = await Promise.all([
    getAllBodyMetrics(userId),
    getWeightUnit(),
  ]);

  const bodyweight = entries.filter((e) => e.kind === "bodyweight");
  const chartData = bodyweight.map((e) => ({
    date: e.performedAt.toISOString().slice(0, 10),
    value: fromKg(e.value, unit),
  }));

  // Latest value per non-bodyweight measurement (entries are oldest-first).
  const latestOther = new Map<string, number>();
  for (const e of entries) {
    if (e.kind !== "bodyweight") latestOther.set(e.kind, e.value);
  }

  const recentBodyweight = [...bodyweight].reverse().slice(0, 8);

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <section>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          Body
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Bodyweight and measurements over time.
        </p>
      </section>

      <section>
        <h2 className="ledger-title mb-3">Bodyweight trend</h2>
        <div className="sheet">
          <BodyChart data={chartData} unit={unit} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="ledger-title mb-3">Log a measurement</h2>
          <div className="sheet h-fit">
            <BodyMetricForm unit={unit} />
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {latestOther.size > 0 ? (
            <section>
              <h2 className="ledger-title mb-3">Latest measurements</h2>
              <ul className="sheet grid grid-cols-2 gap-4">
                {Array.from(latestOther.entries()).map(([kind, value]) => (
                  <li key={kind}>
                    <p className="font-mono text-xl font-semibold tabular-nums">
                      {value}{" "}
                      <span className="text-xs font-normal text-[var(--color-muted)]">
                        cm
                      </span>
                    </p>
                    <p className="font-display text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      {LABELS.get(kind) ?? kind}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="ledger-title mb-3">Recent bodyweight</h2>
            <div className="sheet">
              {recentBodyweight.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">
                  No bodyweight on record yet.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-[var(--color-rule-soft)]">
                  {recentBodyweight.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold tabular-nums">
                          {fromKg(e.value, unit)} {unit}
                        </p>
                        <p className="truncate text-xs text-[var(--color-muted)]">
                          <span className="font-mono">
                            {e.performedAt.toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {e.notes ? ` · ${e.notes}` : ""}
                        </p>
                      </div>
                      <DeleteButton
                        action={deleteBodyMetric.bind(null, e.id)}
                        confirmText="Delete this entry?"
                        label="Delete entry"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
