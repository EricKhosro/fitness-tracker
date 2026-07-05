import "server-only";
import { prisma } from "@/lib/prisma";
import { computePrFlags } from "@/lib/prs";

export type RecentPr = {
  setId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number; // kg
  reps: number;
  performedAt: Date;
  weightPr: boolean;
  oneRmPr: boolean;
};

// Every personal record the user set in the last `days` days, newest first.
// PRs are judged against each exercise's full history, so an old lift never
// counts as a record twice.
export async function getRecentPrs(
  userId: string,
  days = 30,
): Promise<RecentPr[]> {
  const sets = await prisma.workoutSet.findMany({
    where: { userId },
    orderBy: { performedAt: "asc" },
    select: {
      id: true,
      exerciseId: true,
      weight: true,
      reps: true,
      performedAt: true,
      exercise: { select: { name: true } },
    },
  });

  const byExercise = new Map<string, typeof sets>();
  for (const s of sets) {
    const list = byExercise.get(s.exerciseId);
    if (list) list.push(s);
    else byExercise.set(s.exerciseId, [s]);
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const out: RecentPr[] = [];
  for (const list of byExercise.values()) {
    const flags = computePrFlags(list);
    for (const s of list) {
      if (s.performedAt < since) continue;
      const f = flags.get(s.id);
      if (!f || (!f.weight && !f.oneRm)) continue;
      out.push({
        setId: s.id,
        exerciseId: s.exerciseId,
        exerciseName: s.exercise.name,
        weight: s.weight,
        reps: s.reps,
        performedAt: s.performedAt,
        weightPr: f.weight,
        oneRmPr: f.oneRm,
      });
    }
  }

  return out.sort(
    (a, b) => b.performedAt.getTime() - a.performedAt.getTime(),
  );
}
