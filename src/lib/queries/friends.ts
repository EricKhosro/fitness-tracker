import "server-only";
import { prisma } from "@/lib/prisma";
import { computePrFlags, epleyOneRepMax, type PrFlags } from "@/lib/prs";

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

export type ActivityPr = {
  exerciseName: string;
  weight: number; // kg
  reps: number;
  weightPr: boolean;
};

export type FriendActivityEntry = {
  user: FriendUser;
  date: string; // YYYY-MM-DD (UTC day, matching the workouts grouping)
  totalSets: number;
  totalVolume: number; // kg
  exerciseNames: string[]; // by volume, heaviest first
  prs: ActivityPr[];
};

// What your friends trained recently: one entry per friend per day, newest
// first, with any records they set that day.
export async function getFriendActivity(
  userId: string,
  days = 14,
  limit = 12,
): Promise<FriendActivityEntry[]> {
  const { friends } = await getFriendships(userId);
  if (friends.length === 0) return [];
  const friendById = new Map(friends.map((f) => [f.id, f]));

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recent = await prisma.workoutSet.findMany({
    where: { userId: { in: friends.map((f) => f.id) }, performedAt: { gte: since } },
    orderBy: { performedAt: "asc" },
    select: {
      id: true,
      userId: true,
      exerciseId: true,
      weight: true,
      reps: true,
      performedAt: true,
      exercise: { select: { name: true } },
    },
  });
  if (recent.length === 0) return [];

  // PRs are judged against each exercise's full history, not just the window.
  const activeExerciseIds = [...new Set(recent.map((s) => s.exerciseId))];
  const history = await prisma.workoutSet.findMany({
    where: { exerciseId: { in: activeExerciseIds } },
    orderBy: { performedAt: "asc" },
    select: { id: true, exerciseId: true, weight: true, reps: true },
  });
  const historyByExercise = new Map<string, typeof history>();
  for (const s of history) {
    const list = historyByExercise.get(s.exerciseId);
    if (list) list.push(s);
    else historyByExercise.set(s.exerciseId, [s]);
  }
  const prFlags = new Map<string, PrFlags>();
  for (const list of historyByExercise.values()) {
    for (const [id, flags] of computePrFlags(list)) prFlags.set(id, flags);
  }

  type Bucket = {
    user: FriendUser;
    date: string;
    totalSets: number;
    totalVolume: number;
    volumeByExercise: Map<string, number>;
    prByExercise: Map<string, ActivityPr>;
  };
  const buckets = new Map<string, Bucket>();

  for (const s of recent) {
    const date = s.performedAt.toISOString().slice(0, 10);
    const key = `${s.userId}|${date}`;
    let b = buckets.get(key);
    if (!b) {
      b = {
        user: friendById.get(s.userId)!,
        date,
        totalSets: 0,
        totalVolume: 0,
        volumeByExercise: new Map(),
        prByExercise: new Map(),
      };
      buckets.set(key, b);
    }
    const volume = s.weight * s.reps;
    b.totalSets += 1;
    b.totalVolume += volume;
    b.volumeByExercise.set(
      s.exercise.name,
      (b.volumeByExercise.get(s.exercise.name) ?? 0) + volume,
    );

    const flags = prFlags.get(s.id);
    if (flags && (flags.weight || flags.oneRm)) {
      // Keep only the heaviest record per exercise per day.
      const prev = b.prByExercise.get(s.exercise.name);
      if (!prev || s.weight > prev.weight) {
        b.prByExercise.set(s.exercise.name, {
          exerciseName: s.exercise.name,
          weight: s.weight,
          reps: s.reps,
          weightPr: flags.weight,
        });
      }
    }
  }

  return Array.from(buckets.values())
    .map((b) => ({
      user: b.user,
      date: b.date,
      totalSets: b.totalSets,
      totalVolume: Math.round(b.totalVolume),
      exerciseNames: Array.from(b.volumeByExercise.entries())
        .sort((a, z) => z[1] - a[1])
        .map(([name]) => name),
      prs: Array.from(b.prByExercise.values()),
    }))
    .sort((a, z) => z.date.localeCompare(a.date) || z.totalVolume - a.totalVolume)
    .slice(0, limit);
}

export type ExerciseLeaderboardRow = FriendUser & {
  isYou: boolean;
  best: {
    weight: number; // kg
    reps: number;
    oneRm: number; // kg
    performedAt: Date;
  } | null;
};

// You and your friends compared on one lift, matched by exercise name.
// Ranked by heaviest set; members who never logged it sit at the bottom.
export async function getExerciseLeaderboard(
  userId: string,
  exerciseName: string,
): Promise<ExerciseLeaderboardRow[]> {
  const { friends } = await getFriendships(userId);
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
  if (!me) return [];

  const members: FriendUser[] = [me, ...friends];
  const sets = await prisma.workoutSet.findMany({
    where: {
      userId: { in: members.map((m) => m.id) },
      exercise: { name: { equals: exerciseName.trim(), mode: "insensitive" } },
    },
    select: { userId: true, weight: true, reps: true, performedAt: true },
  });

  const bestByUser = new Map<string, ExerciseLeaderboardRow["best"]>();
  for (const s of sets) {
    const prev = bestByUser.get(s.userId);
    if (
      !prev ||
      s.weight > prev.weight ||
      (s.weight === prev.weight && s.reps > prev.reps)
    ) {
      bestByUser.set(s.userId, {
        weight: s.weight,
        reps: s.reps,
        oneRm: epleyOneRepMax(s.weight, s.reps),
        performedAt: s.performedAt,
      });
    }
  }

  return members
    .map((m) => ({
      ...m,
      isYou: m.id === userId,
      best: bestByUser.get(m.id) ?? null,
    }))
    .sort((a, z) => (z.best?.weight ?? -1) - (a.best?.weight ?? -1));
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
