"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/dal";
import { muscleGroupFor, STARTER_EXERCISES } from "@/lib/favorite-exercises";
import type { ActionState } from "@/lib/actions/types";

const createExerciseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name too long"),
});

export async function createExercise(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = createExerciseSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await prisma.exercise.create({
      data: {
        name: parsed.data.name,
        muscleGroup: muscleGroupFor(parsed.data.name),
        userId,
      },
    });
  } catch {
    return { error: "You already have an exercise with that name." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

// One-click "add a few starter exercises" for the empty state.
export async function addStarterExercises() {
  const userId = await requireUserId();
  await prisma.exercise.createMany({
    data: STARTER_EXERCISES.map((name) => ({
      name,
      muscleGroup: muscleGroupFor(name),
      userId,
    })),
    skipDuplicates: true,
  });
  revalidatePath("/dashboard");
}

export async function deleteExercise(exerciseId: string) {
  const userId = await requireUserId();
  await prisma.exercise.deleteMany({ where: { id: exerciseId, userId } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workouts");
}
