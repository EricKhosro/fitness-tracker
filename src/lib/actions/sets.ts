"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId, getWeightUnit } from "@/lib/dal";
import { toKg } from "@/lib/units";
import type { ActionState } from "@/lib/actions/types";

const logSetSchema = z.object({
  exerciseId: z.string().min(1, "Pick an exercise"),
  weight: z.coerce.number().min(0, "Weight must be 0 or more").max(20000),
  reps: z.coerce.number().int().min(1, "Reps must be at least 1").max(10000),
  performedAt: z.string().optional(),
  notes: z.string().trim().max(280).optional(),
});

export async function logSet(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const unit = await getWeightUnit();

  const parsed = logSetSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    weight: formData.get("weight"),
    reps: formData.get("reps"),
    performedAt: formData.get("performedAt"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { exerciseId, weight, reps, performedAt, notes } = parsed.data;

  // Verify the exercise belongs to this user before logging against it.
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, userId },
    select: { id: true },
  });
  if (!exercise) {
    return { error: "Exercise not found." };
  }

  await prisma.workoutSet.create({
    data: {
      userId,
      exerciseId,
      weight: toKg(weight, unit), // entered in the user's unit; store in kg
      reps,
      notes: notes || null,
      performedAt: performedAt ? new Date(performedAt) : new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workouts");
  revalidatePath(`/dashboard/exercise/${exerciseId}`);
  return { ok: true };
}

const updateSetSchema = z.object({
  id: z.string().min(1),
  weight: z.coerce.number().min(0, "Weight must be 0 or more").max(20000),
  reps: z.coerce.number().int().min(1, "Reps must be at least 1").max(10000),
  notes: z.string().trim().max(280).optional(),
});

export async function updateSet(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const unit = await getWeightUnit();

  const parsed = updateSetSchema.safeParse({
    id: formData.get("id"),
    weight: formData.get("weight"),
    reps: formData.get("reps"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { id, weight, reps, notes } = parsed.data;

  // updateMany scopes by userId so a user can only edit their own rows.
  const result = await prisma.workoutSet.updateMany({
    where: { id, userId },
    data: { weight: toKg(weight, unit), reps, notes: notes || null },
  });
  if (result.count === 0) {
    return { error: "Set not found." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workouts");
  revalidatePath("/dashboard/exercise/[id]", "page");
  return { ok: true };
}

export async function deleteSet(setId: string) {
  const userId = await requireUserId();
  // deleteMany scopes by userId so a user can only delete their own rows.
  await prisma.workoutSet.deleteMany({ where: { id: setId, userId } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workouts");
  revalidatePath("/dashboard/exercise/[id]", "page");
}
