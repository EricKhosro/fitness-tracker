"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type BodyPoint = { date: string; value: number };

export function BodyChart({
  data,
  unit,
}: {
  data: BodyPoint[];
  unit: string;
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        Log a few entries and the trend draws itself here.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
            formatter={(value) => [`${value} ${unit}`, "Value"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-green)"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "var(--color-green)", strokeWidth: 0 }}
            activeDot={{ r: 4.5, fill: "var(--color-red)", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
