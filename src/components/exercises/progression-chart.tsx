"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProgressionPoint } from "@/lib/queries/exercises";
import type { WeightUnit } from "@/lib/units";

type Metric = {
  key: keyof Pick<
    ProgressionPoint,
    "topWeight" | "totalVolume" | "estimatedOneRepMax"
  >;
  label: string;
};

const METRICS: Metric[] = [
  { key: "topWeight", label: "Top weight" },
  { key: "estimatedOneRepMax", label: "Est. 1RM" },
  { key: "totalVolume", label: "Volume" },
];

export function ProgressionChart({
  data,
  unit,
}: {
  data: ProgressionPoint[];
  unit: WeightUnit;
}) {
  const [metric, setMetric] = useState<Metric>(METRICS[0]);

  if (data.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        Log a few sets and the graph draws itself here.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m)}
            className={`rounded-[3px] px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
              m.key === metric.key
                ? "bg-[var(--color-ink)] text-[var(--color-sheet)]"
                : "border border-[var(--color-rule)] text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          >
            <CartesianGrid stroke="var(--color-rule-soft)" />
            <XAxis
              dataKey="date"
              tick={{
                fill: "var(--color-muted)",
                fontSize: 11,
                fontFamily: "var(--font-plex-mono)",
              }}
              tickFormatter={(d: string) => d.slice(5)}
              stroke="var(--color-rule)"
            />
            <YAxis
              tick={{
                fill: "var(--color-muted)",
                fontSize: 11,
                fontFamily: "var(--font-plex-mono)",
              }}
              stroke="var(--color-rule)"
              width={44}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-sheet)",
                border: "1px solid var(--color-rule)",
                borderRadius: 3,
                color: "var(--color-ink)",
                fontFamily: "var(--font-plex-mono)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--color-muted)" }}
              formatter={(value) => [`${value} ${unit}`, metric.label]}
            />
            <Line
              type="monotone"
              dataKey={metric.key}
              stroke="var(--color-green)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "var(--color-green)", strokeWidth: 0 }}
              activeDot={{ r: 4.5, fill: "var(--color-red)", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
