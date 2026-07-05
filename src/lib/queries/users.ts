import "server-only";
import { prisma } from "@/lib/prisma";

export type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string | null;
  createdAt: Date;
  totalExercises: number;
  totalSets: number;
};

// The signed-in user's own profile with a couple of lifetime stats.
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
      createdAt: true,
      _count: { select: { exercises: true, sets: true } },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    username: user.username,
    createdAt: user.createdAt,
    totalExercises: user._count.exercises,
    totalSets: user._count.sets,
  };
}
