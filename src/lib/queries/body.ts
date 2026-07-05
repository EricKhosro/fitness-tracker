import "server-only";
import { prisma } from "@/lib/prisma";

export type BodyMetricEntry = {
  id: string;
  value: number;
  performedAt: Date;
  notes: string | null;
};

// All of a user's body metric entries (every kind), oldest first.
export async function getAllBodyMetrics(
  userId: string,
): Promise<(BodyMetricEntry & { kind: string })[]> {
  return prisma.bodyMetric.findMany({
    where: { userId },
    orderBy: { performedAt: "asc" },
    select: { id: true, kind: true, value: true, performedAt: true, notes: true },
  });
}
