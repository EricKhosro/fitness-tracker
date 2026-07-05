import "server-only";
import { prisma } from "@/lib/prisma";

export type RoutineSummary = {
  id: string;
  name: string;
  exerciseNames: string[];
};

// All of a user's saved routines with the names of their exercises.
export async function getRoutines(userId: string): Promise<RoutineSummary[]> {
  const routines = await prisma.routine.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      items: {
        orderBy: { position: "asc" },
        select: { exercise: { select: { name: true } } },
      },
    },
  });

  return routines.map((r) => ({
    id: r.id,
    name: r.name,
    exerciseNames: r.items.map((i) => i.exercise.name),
  }));
}

export type RoutineExercise = {
  exerciseId: string;
  name: string;
  muscleGroup: string | null;
  lastSet: { weight: number; reps: number } | null; // weight in kg
};

export type RoutineDetail = {
  id: string;
  name: string;
  exercises: RoutineExercise[];
};

// A single routine (scoped to the owner) with each exercise's most recent set.
export async function getRoutine(
  userId: string,
  routineId: string,
): Promise<RoutineDetail | null> {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
    select: {
      id: true,
      name: true,
      items: {
        orderBy: { position: "asc" },
        select: {
          exercise: { select: { id: true, name: true, muscleGroup: true } },
        },
      },
    },
  });
  if (!routine) return null;

  const exerciseIds = routine.items.map((i) => i.exercise.id);
  // Latest set per exercise, in one query.
  const lastSets = exerciseIds.length
    ? await prisma.workoutSet.findMany({
        where: { userId, exerciseId: { in: exerciseIds } },
        orderBy: { performedAt: "desc" },
        distinct: ["exerciseId"],
        select: { exerciseId: true, weight: true, reps: true },
      })
    : [];
  const lastByExercise = new Map(
    lastSets.map((s) => [s.exerciseId, { weight: s.weight, reps: s.reps }]),
  );

  return {
    id: routine.id,
    name: routine.name,
    exercises: routine.items.map((i) => ({
      exerciseId: i.exercise.id,
      name: i.exercise.name,
      muscleGroup: i.exercise.muscleGroup,
      lastSet: lastByExercise.get(i.exercise.id) ?? null,
    })),
  };
}
