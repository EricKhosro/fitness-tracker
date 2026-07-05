import "server-only";
import { prisma } from "@/lib/prisma";

export type ExerciseSummary = {
  id: string;
  name: string;
  muscleGroup: string | null;
  totalSets: number;
  lastPerformedAt: Date | null;
  bestWeight: number | null;
};

// All of a user's exercises with lightweight aggregate stats for the overview.
export async function getExerciseSummaries(
  userId: string,
): Promise<ExerciseSummary[]> {
  const exercises = await prisma.exercise.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      muscleGroup: true,
      _count: { select: { sets: true } },
      sets: {
        orderBy: { performedAt: "desc" },
        take: 1,
        select: { performedAt: true },
      },
    },
  });

  // Best (max) weight per exercise in one grouped query.
  const maxWeights = await prisma.workoutSet.groupBy({
    by: ["exerciseId"],
    where: { userId },
    _max: { weight: true },
  });
  const bestByExercise = new Map(
    maxWeights.map((m) => [m.exerciseId, m._max.weight]),
  );

  return exercises.map((e) => ({
    id: e.id,
    name: e.name,
    muscleGroup: e.muscleGroup,
    totalSets: e._count.sets,
    lastPerformedAt: e.sets[0]?.performedAt ?? null,
    bestWeight: bestByExercise.get(e.id) ?? null,
  }));
}

// Just the names of a user's exercises, for pickers.
export async function getExerciseNames(userId: string): Promise<string[]> {
  const rows = await prisma.exercise.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return rows.map((r) => r.name);
}

// A single exercise (scoped to the owner) with all of its logged sets.
export async function getExerciseWithSets(userId: string, exerciseId: string) {
  return prisma.exercise.findFirst({
    where: { id: exerciseId, userId },
    include: {
      sets: {
        orderBy: { performedAt: "asc" },
      },
    },
  });
}

export type ProgressionPoint = {
  date: string;
  topWeight: number;
  totalVolume: number;
  estimatedOneRepMax: number;
};

// Daily progression series for charting: best weight, volume, and est. 1RM per day.
export async function getProgression(
  userId: string,
  exerciseId: string,
): Promise<ProgressionPoint[]> {
  const sets = await prisma.workoutSet.findMany({
    where: { userId, exerciseId },
    orderBy: { performedAt: "asc" },
    select: { weight: true, reps: true, performedAt: true },
  });

  const byDay = new Map<
    string,
    { topWeight: number; totalVolume: number; oneRepMax: number }
  >();

  for (const set of sets) {
    const day = set.performedAt.toISOString().slice(0, 10);
    // Epley formula for estimated one-rep max.
    const oneRepMax = set.weight * (1 + set.reps / 30);
    const volume = set.weight * set.reps;

    const existing = byDay.get(day);
    if (existing) {
      existing.topWeight = Math.max(existing.topWeight, set.weight);
      existing.totalVolume += volume;
      existing.oneRepMax = Math.max(existing.oneRepMax, oneRepMax);
    } else {
      byDay.set(day, {
        topWeight: set.weight,
        totalVolume: volume,
        oneRepMax,
      });
    }
  }

  return Array.from(byDay.entries()).map(([date, v]) => ({
    date,
    topWeight: Math.round(v.topWeight * 100) / 100,
    totalVolume: Math.round(v.totalVolume * 100) / 100,
    estimatedOneRepMax: Math.round(v.oneRepMax * 10) / 10,
  }));
}
