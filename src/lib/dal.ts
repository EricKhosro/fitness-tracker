import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isWeightUnit, type WeightUnit } from "@/lib/units";

// Returns the current session, or null if signed out. Memoized per request.
export const getSession = cache(async () => {
  return auth();
});

// Returns the signed-in user's id, redirecting to the landing page if absent.
export const requireUserId = cache(async (): Promise<string> => {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/");
  }
  return session.user.id;
});

// The signed-in user's preferred weight unit. Memoized per request.
export const getWeightUnit = cache(async (): Promise<WeightUnit> => {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { weightUnit: true },
  });
  return isWeightUnit(user?.weightUnit) ? user.weightUnit : "kg";
});
