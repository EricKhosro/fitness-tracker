"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/dal";
import type { ActionState } from "@/lib/actions/types";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9_]{3,20}$/,
    "3–20 characters: lowercase letters, numbers and underscores",
  );

export async function setUsername(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = usernameSchema.safeParse(formData.get("username"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid username" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { username: parsed.data },
    });
  } catch {
    return { error: "That username is taken." };
  }

  revalidatePath("/dashboard/profile");
  return { ok: true };
}
