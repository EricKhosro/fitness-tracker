import "server-only";
import { prisma } from "@/lib/prisma";

export type WorkoutDay = {
  date: string; // YYYY-MM-DD
  totalSets: number;
  totalVolume: number; // kg
  exercises: { name: string; sets: number; volume: number }[];
};

// Every logged set grouped into per-day "workouts", newest day first.
export async function getWorkoutsByDay(userId: string): Promise<WorkoutDay[]> {
  const sets = await prisma.workoutSet.findMany({
    where: { userId },
    orderBy: { performedAt: "desc" },
    select: {
      weight: true,
      reps: true,
      performedAt: true,
      exercise: { select: { name: true } },
    },
  });

  const byDay = new Map<
    string,
    { totalSets: number; totalVolume: number; ex: Map<string, { sets: number; volume: number }> }
  >();

  for (const s of sets) {
    const day = s.performedAt.toISOString().slice(0, 10);
    const volume = s.weight * s.reps;
    let entry = byDay.get(day);
    if (!entry) {
      entry = { totalSets: 0, totalVolume: 0, ex: new Map() };
      byDay.set(day, entry);
    }
    entry.totalSets += 1;
    entry.totalVolume += volume;
    const ex = entry.ex.get(s.exercise.name) ?? { sets: 0, volume: 0 };
    ex.sets += 1;
    ex.volume += volume;
    entry.ex.set(s.exercise.name, ex);
  }

  return Array.from(byDay.entries()).map(([date, v]) => ({
    date,
    totalSets: v.totalSets,
    totalVolume: Math.round(v.totalVolume * 100) / 100,
    exercises: Array.from(v.ex.entries())
      .map(([name, x]) => ({
        name,
        sets: x.sets,
        volume: Math.round(x.volume * 100) / 100,
      }))
      .sort((a, b) => b.volume - a.volume),
  }));
}
