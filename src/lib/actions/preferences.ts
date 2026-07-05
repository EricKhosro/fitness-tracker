"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/dal";
import { isWeightUnit } from "@/lib/units";

// Switch the user's display unit (kg <-> lb). Stored values stay in kg.
export async function setWeightUnit(unit: string) {
  const userId = await requireUserId();
  if (!isWeightUnit(unit)) return;
  await prisma.user.update({ where: { id: userId }, data: { weightUnit: unit } });
  revalidatePath("/", "layout");
}
