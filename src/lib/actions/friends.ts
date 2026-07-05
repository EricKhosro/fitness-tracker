"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/dal";
import type { ActionState } from "@/lib/actions/types";

const targetSchema = z.string().min(1);

// Send a friend request to another user. If they already sent one to us,
// accept it instead of creating a duplicate in the other direction.
export async function sendFriendRequest(
  targetUserId: string,
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = targetSchema.safeParse(targetUserId);
  if (!parsed.success || parsed.data === userId) {
    return { error: "Invalid user." };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data },
    select: { id: true },
  });
  if (!target) {
    return { error: "User not found." };
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: target.id },
        { requesterId: target.id, addresseeId: userId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      return { error: "You are already friends." };
    }
    if (existing.addresseeId === userId) {
      // They asked first — this counts as accepting.
      await prisma.friendship.update({
        where: { id: existing.id },
        data: { status: "ACCEPTED" },
      });
      revalidatePath("/dashboard/friends");
      return { ok: true };
    }
    return { error: "Request already sent." };
  }

  await prisma.friendship.create({
    data: { requesterId: userId, addresseeId: target.id },
  });

  revalidatePath("/dashboard/friends");
  return { ok: true };
}

export async function acceptFriendRequest(friendshipId: string) {
  const userId = await requireUserId();
  // updateMany scopes by addressee so only the recipient can accept.
  await prisma.friendship.updateMany({
    where: { id: friendshipId, addresseeId: userId, status: "PENDING" },
    data: { status: "ACCEPTED" },
  });
  revalidatePath("/dashboard/friends");
}

export async function declineFriendRequest(friendshipId: string) {
  const userId = await requireUserId();
  await prisma.friendship.deleteMany({
    where: { id: friendshipId, addresseeId: userId, status: "PENDING" },
  });
  revalidatePath("/dashboard/friends");
}

export async function cancelFriendRequest(friendshipId: string) {
  const userId = await requireUserId();
  await prisma.friendship.deleteMany({
    where: { id: friendshipId, requesterId: userId, status: "PENDING" },
  });
  revalidatePath("/dashboard/friends");
}

export async function removeFriend(friendshipId: string) {
  const userId = await requireUserId();
  await prisma.friendship.deleteMany({
    where: {
      id: friendshipId,
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
  });
  revalidatePath("/dashboard/friends");
}
