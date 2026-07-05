"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId, getWeightUnit } from "@/lib/dal";
import { toKg } from "@/lib/units";
import { BODY_KIND_VALUES } from "@/lib/body-metrics";
import type { ActionState } from "@/lib/actions/types";

const logBodyMetricSchema = z.object({
  kind: z.enum(BODY_KIND_VALUES),
  value: z.coerce.number().positive("Enter a value").max(1000),
  performedAt: z.string().optional(),
  notes: z.string().trim().max(280).optional(),
});

export async function logBodyMetric(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const unit = await getWeightUnit();

  const parsed = logBodyMetricSchema.safeParse({
    kind: formData.get("kind"),
    value: formData.get("value"),
    performedAt: formData.get("performedAt"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { kind, value, performedAt, notes } = parsed.data;

  await prisma.bodyMetric.create({
    data: {
      userId,
      kind,
      // Bodyweight follows the weight unit; circumferences are always cm.
      value: kind === "bodyweight" ? toKg(value, unit) : value,
      notes: notes || null,
      performedAt: performedAt ? new Date(performedAt) : new Date(),
    },
  });

  revalidatePath("/dashboard/body");
  return { ok: true };
}

export async function deleteBodyMetric(id: string) {
  const userId = await requireUserId();
  await prisma.bodyMetric.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/body");
}
