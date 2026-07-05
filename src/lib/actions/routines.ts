"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/dal";
import type { ActionState } from "@/lib/actions/types";

const saveRoutineSchema = z.object({
  // The day to capture, as YYYY-MM-DD (matches the UTC grouping on /workouts).
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  name: z.string().trim().min(1, "Name is required").max(60, "Name too long"),
});

// Save the distinct exercises logged on a given day as a reusable routine.
export async function saveRoutineFromDay(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = saveRoutineSchema.safeParse({
    date: formData.get("date"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { date, name } = parsed.data;

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const sets = await prisma.workoutSet.findMany({
    where: { userId, performedAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { performedAt: "asc" },
    select: { exerciseId: true },
  });

  // Distinct exercise ids, preserving the order they were first performed.
  const orderedExerciseIds: string[] = [];
  const seen = new Set<string>();
  for (const s of sets) {
    if (!seen.has(s.exerciseId)) {
      seen.add(s.exerciseId);
      orderedExerciseIds.push(s.exerciseId);
    }
  }

  if (orderedExerciseIds.length === 0) {
    return { error: "No exercises were logged on that day." };
  }

  try {
    await prisma.routine.create({
      data: {
        userId,
        name,
        items: {
          create: orderedExerciseIds.map((exerciseId, position) => ({
            exerciseId,
            position,
          })),
        },
      },
    });
  } catch {
    return { error: "You already have a routine with that name." };
  }

  revalidatePath("/dashboard/routines");
  revalidatePath("/dashboard/workouts");
  return { ok: true };
}

export async function deleteRoutine(routineId: string) {
  const userId = await requireUserId();
  await prisma.routine.deleteMany({ where: { id: routineId, userId } });
  revalidatePath("/dashboard/routines");
}
