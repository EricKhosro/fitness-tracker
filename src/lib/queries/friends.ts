import "server-only";
import { prisma } from "@/lib/prisma";

export type FriendUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export type Friendships = {
  friends: (FriendUser & { friendshipId: string })[];
  incoming: { friendshipId: string; user: FriendUser }[];
  outgoing: { friendshipId: string; user: FriendUser }[];
};

const USER_SELECT = {
  id: true,
  name: true,
  username: true,
  image: true,
} as const;

// Everyone connected to this user: accepted friends plus pending requests
// in both directions.
export async function getFriendships(userId: string): Promise<Friendships> {
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: {
      id: true,
      status: true,
      requesterId: true,
      requester: { select: USER_SELECT },
      addressee: { select: USER_SELECT },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends: Friendships["friends"] = [];
  const incoming: Friendships["incoming"] = [];
  const outgoing: Friendships["outgoing"] = [];

  for (const row of rows) {
    const other = row.requesterId === userId ? row.addressee : row.requester;
    if (row.status === "ACCEPTED") {
      friends.push({ ...other, friendshipId: row.id });
    } else if (row.requesterId === userId) {
      outgoing.push({ friendshipId: row.id, user: other });
    } else {
      incoming.push({ friendshipId: row.id, user: other });
    }
  }

  return { friends, incoming, outgoing };
}

export type UserSearchResult = FriendUser & {
  relation: "none" | "friends" | "incoming" | "outgoing";
  friendshipId: string | null;
};

// Find users by (partial) username, annotated with how they relate to the
// searching user.
export async function searchUsersByUsername(
  userId: string,
  query: string,
): Promise<UserSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const users = await prisma.user.findMany({
    where: {
      username: { contains: q },
      NOT: { id: userId },
    },
    select: USER_SELECT,
    orderBy: { username: "asc" },
    take: 10,
  });
  if (users.length === 0) return [];

  const ids = users.map((u) => u.id);
  const rels = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId, addresseeId: { in: ids } },
        { addresseeId: userId, requesterId: { in: ids } },
      ],
    },
    select: { id: true, status: true, requesterId: true, addresseeId: true },
  });

  return users.map((u) => {
    const rel = rels.find(
      (r) => r.requesterId === u.id || r.addresseeId === u.id,
    );
    let relation: UserSearchResult["relation"] = "none";
    if (rel) {
      if (rel.status === "ACCEPTED") relation = "friends";
      else relation = rel.requesterId === userId ? "outgoing" : "incoming";
    }
    return { ...u, relation, friendshipId: rel?.id ?? null };
  });
}

export type LeaderboardRow = FriendUser & {
  isYou: boolean;
  sets30d: number;
  volume30d: number; // kg
  bestWeight: number | null; // kg, all time
};

// You and your accepted friends, ranked by training volume over the last
// 30 days.
export async function getFriendLeaderboard(
  userId: string,
): Promise<LeaderboardRow[]> {
  const { friends } = await getFriendships(userId);
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
  if (!me) return [];

  const members: FriendUser[] = [me, ...friends];
  const ids = members.map((m) => m.id);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [recentSets, bests] = await Promise.all([
    prisma.workoutSet.findMany({
      where: { userId: { in: ids }, performedAt: { gte: since } },
      select: { userId: true, weight: true, reps: true },
    }),
    prisma.workoutSet.groupBy({
      by: ["userId"],
      where: { userId: { in: ids } },
      _max: { weight: true },
    }),
  ]);

  const totals = new Map<string, { sets: number; volume: number }>();
  for (const s of recentSets) {
    const t = totals.get(s.userId) ?? { sets: 0, volume: 0 };
    t.sets += 1;
    t.volume += s.weight * s.reps;
    totals.set(s.userId, t);
  }
  const bestByUser = new Map(bests.map((b) => [b.userId, b._max.weight]));

  return members
    .map((m) => ({
      ...m,
      isYou: m.id === userId,
      sets30d: totals.get(m.id)?.sets ?? 0,
      volume30d: Math.round(totals.get(m.id)?.volume ?? 0),
      bestWeight: bestByUser.get(m.id) ?? null,
    }))
    .sort((a, b) => b.volume30d - a.volume30d);
}
