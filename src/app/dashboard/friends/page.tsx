import Image from "next/image";
import Link from "next/link";
import { requireUserId, getWeightUnit } from "@/lib/dal";
import {
  getFriendships,
  getFriendLeaderboard,
  getFriendActivity,
  getExerciseLeaderboard,
  searchUsersByUsername,
  type FriendUser,
} from "@/lib/queries/friends";
import { getExerciseNames } from "@/lib/queries/exercises";
import { getUserProfile } from "@/lib/queries/users";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from "@/lib/actions/friends";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { formatWeight, formatVolume } from "@/lib/units";

// "YYYY-MM-DD" → "Jul 3" in the local format.
function formatActivityDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function FriendsPage(
  props: PageProps<"/dashboard/friends">,
) {
  const userId = await requireUserId();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const ex = typeof searchParams.ex === "string" ? searchParams.ex : "";

  const [
    profile,
    friendships,
    leaderboard,
    activity,
    exerciseNames,
    exerciseBoard,
    results,
    unit,
  ] = await Promise.all([
    getUserProfile(userId),
    getFriendships(userId),
    getFriendLeaderboard(userId),
    getFriendActivity(userId),
    getExerciseNames(userId),
    ex ? getExerciseLeaderboard(userId, ex) : Promise.resolve([]),
    q ? searchUsersByUsername(userId, q) : Promise.resolve([]),
    getWeightUnit(),
  ]);
  const { friends, incoming, outgoing } = friendships;

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <section>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          Friends
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Train with people you know — and see who&apos;s putting in the work.
        </p>
      </section>

      {friends.length > 0 ? (
        <>
        <section>
          <h2 className="ledger-title mb-3">Leaderboard — last 30 days</h2>
          <div className="sheet overflow-x-auto p-0 sm:p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-rule)] text-left font-mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
                  <th className="px-4 py-2.5 font-medium sm:px-5">#</th>
                  <th className="py-2.5 font-medium">Lifter</th>
                  <th className="py-2.5 text-right font-medium">Sets</th>
                  <th className="py-2.5 text-right font-medium">Volume</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">
                    Best lift
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-rule-soft)] last:border-b-0"
                  >
                    <td className="px-4 py-3 font-mono tabular-nums sm:px-5">
                      {i === 0 ? (
                        <span className="pr-ring">{i + 1}</span>
                      ) : (
                        i + 1
                      )}
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-2">
                        <Avatar user={row} size={24} />
                        <span
                          className={`truncate font-medium ${
                            row.isYou ? "text-[var(--color-green)]" : ""
                          }`}
                        >
                          {row.name ?? row.username ?? "Lifter"}
                          {row.isYou ? " (you)" : ""}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums">
                      {row.sets30d}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums">
                      {formatVolume(row.volume30d, unit)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums sm:px-5">
                      {row.bestWeight != null
                        ? formatWeight(row.bestWeight, unit)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {exerciseNames.length > 0 ? (
          <section>
            <h2 className="ledger-title mb-3">Head to head</h2>
            <div className="sheet">
              <form action="/dashboard/friends" className="flex gap-2">
                {q ? <input type="hidden" name="q" value={q} /> : null}
                <select
                  name="ex"
                  defaultValue={ex}
                  className="input flex-1"
                  aria-label="Exercise to compare"
                >
                  <option value="" disabled>
                    Pick a lift…
                  </option>
                  {exerciseNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary shrink-0">
                  Compare
                </button>
              </form>

              {ex ? (
                <div className="mt-4 overflow-x-auto border-t border-[var(--color-rule)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-rule)] text-left font-mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
                        <th className="py-2.5 pr-3 font-medium">#</th>
                        <th className="py-2.5 font-medium">Lifter</th>
                        <th className="py-2.5 text-right font-medium">
                          Best set
                        </th>
                        <th className="py-2.5 text-right font-medium">
                          Est. 1RM
                        </th>
                        <th className="py-2.5 pl-3 text-right font-medium">
                          When
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {exerciseBoard.map((row, i) => (
                        <tr
                          key={row.id}
                          className="border-b border-[var(--color-rule-soft)] last:border-b-0"
                        >
                          <td className="py-3 pr-3 font-mono tabular-nums">
                            {i === 0 && row.best ? (
                              <span className="pr-ring">{i + 1}</span>
                            ) : (
                              i + 1
                            )}
                          </td>
                          <td
                            className={`py-3 font-medium ${
                              row.isYou ? "text-[var(--color-green)]" : ""
                            }`}
                          >
                            {row.name ?? row.username ?? "Lifter"}
                            {row.isYou ? " (you)" : ""}
                          </td>
                          <td className="py-3 text-right font-mono tabular-nums">
                            {row.best
                              ? `${formatWeight(row.best.weight, unit)} × ${row.best.reps}`
                              : "—"}
                          </td>
                          <td className="py-3 text-right font-mono tabular-nums">
                            {row.best
                              ? formatWeight(row.best.oneRm, unit)
                              : "—"}
                          </td>
                          <td className="py-3 pl-3 text-right font-mono text-xs text-[var(--color-muted)]">
                            {row.best
                              ? row.best.performedAt.toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "numeric" },
                                )
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  Compare one lift across your crew — matched by exercise
                  name.
                </p>
              )}
            </div>
          </section>
        ) : null}

        {activity.length > 0 ? (
          <section>
            <h2 className="ledger-title mb-3">Recent activity</h2>
            <ul className="sheet p-0 sm:p-0">
              {activity.map((a) => (
                <li
                  key={`${a.user.id}|${a.date}`}
                  className="flex flex-col gap-1 border-b border-[var(--color-rule-soft)] px-4 py-3 last:border-b-0 sm:px-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar user={a.user} size={24} />
                      <span className="truncate text-sm font-medium">
                        {a.user.name ?? a.user.username ?? "Lifter"}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-[var(--color-muted)]">
                      {formatActivityDay(a.date)}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-[var(--color-muted)]">
                    {a.totalSets} set{a.totalSets === 1 ? "" : "s"} ·{" "}
                    {formatVolume(a.totalVolume, unit)} ·{" "}
                    {a.exerciseNames.slice(0, 3).join(", ")}
                    {a.exerciseNames.length > 3 ? "…" : ""}
                  </p>
                  {a.prs.map((pr) => (
                    <p
                      key={pr.exerciseName}
                      className="flex flex-wrap items-center gap-x-2 font-mono text-sm"
                    >
                      <span className="truncate">{pr.exerciseName}</span>
                      <span className={pr.weightPr ? "pr-ring" : undefined}>
                        {formatWeight(pr.weight, unit)} × {pr.reps}
                      </span>
                      <span className="ink-note">
                        {pr.weightPr ? "PR" : "1RM PR"}
                      </span>
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        </>
      ) : null}

      <section>
        <h2 className="ledger-title mb-3">Find lifters</h2>
        <div className="sheet">
          {!profile?.username ? (
            <p className="mb-4 border-b border-[var(--color-rule)] pb-4 text-sm text-[var(--color-muted)]">
              Claim a username on{" "}
              <Link
                href="/dashboard/profile"
                className="font-medium text-[var(--color-green)] underline underline-offset-2"
              >
                your profile
              </Link>{" "}
              so friends can find you too.
            </p>
          ) : null}
          <form action="/dashboard/friends" className="flex gap-2">
            {ex ? <input type="hidden" name="ex" value={ex} /> : null}
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[var(--color-muted)]">
                @
              </span>
              <input
                name="q"
                defaultValue={q}
                className="input pl-7 font-mono lowercase"
                placeholder="username"
                maxLength={20}
                aria-label="Search by username"
              />
            </div>
            <button type="submit" className="btn btn-primary shrink-0">
              Search
            </button>
          </form>

          {q ? (
            results.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--color-muted)]">
                No lifters found for{" "}
                <span className="font-mono">@{q.toLowerCase()}</span>. Handles
                are exact-ish — ask your friend for theirs.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-[var(--color-rule-soft)] border-t border-[var(--color-rule)]">
                {results.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <UserLine user={r} />
                    {r.relation === "none" ? (
                      <FriendActionButton
                        action={sendFriendRequest.bind(null, r.id)}
                        variant="primary"
                      >
                        Add friend
                      </FriendActionButton>
                    ) : r.relation === "friends" ? (
                      <span className="font-mono text-xs text-[var(--color-green)]">
                        Friends ✓
                      </span>
                    ) : r.relation === "outgoing" ? (
                      <span className="font-mono text-xs text-[var(--color-muted)]">
                        Request sent
                      </span>
                    ) : (
                      <FriendActionButton
                        action={acceptFriendRequest.bind(
                          null,
                          r.friendshipId ?? "",
                        )}
                        variant="primary"
                      >
                        Accept request
                      </FriendActionButton>
                    )}
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      </section>

      {incoming.length > 0 || outgoing.length > 0 ? (
        <section>
          <h2 className="ledger-title mb-3">Requests</h2>
          <div className="sheet">
            <ul className="divide-y divide-[var(--color-rule-soft)]">
              {incoming.map((r) => (
                <li
                  key={r.friendshipId}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <UserLine user={r.user} note="wants to be friends" />
                  <span className="flex items-center gap-2">
                    <FriendActionButton
                      action={acceptFriendRequest.bind(null, r.friendshipId)}
                      variant="primary"
                    >
                      Accept
                    </FriendActionButton>
                    <FriendActionButton
                      action={declineFriendRequest.bind(null, r.friendshipId)}
                    >
                      Decline
                    </FriendActionButton>
                  </span>
                </li>
              ))}
              {outgoing.map((r) => (
                <li
                  key={r.friendshipId}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <UserLine user={r.user} note="request sent" />
                  <FriendActionButton
                    action={cancelFriendRequest.bind(null, r.friendshipId)}
                  >
                    Cancel
                  </FriendActionButton>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="ledger-title mb-3">Your friends</h2>
        {friends.length === 0 ? (
          <div className="sheet py-8 text-center text-[var(--color-muted)]">
            No friends in the log yet. Search a username above to add your
            first training partner.
          </div>
        ) : (
          <div className="sheet">
            <ul className="divide-y divide-[var(--color-rule-soft)]">
              {friends.map((f) => (
                <li
                  key={f.friendshipId}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <UserLine user={f} />
                  <FriendActionButton
                    action={removeFriend.bind(null, f.friendshipId)}
                    confirmText={`Remove ${f.name ?? f.username ?? "this friend"} from your friends?`}
                  >
                    Remove
                  </FriendActionButton>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function Avatar({ user, size }: { user: FriendUser; size: number }) {
  if (!user.image) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-[3px] border border-[var(--color-rule)] bg-[var(--color-paper)] font-mono text-[10px] uppercase text-[var(--color-muted)]"
        style={{ width: size, height: size }}
      >
        {(user.name ?? user.username ?? "?").slice(0, 1)}
      </span>
    );
  }
  return (
    <Image
      src={user.image}
      alt={user.name ?? user.username ?? "Lifter"}
      width={size}
      height={size}
      className="shrink-0 rounded-[3px] border border-[var(--color-rule)]"
    />
  );
}

function UserLine({ user, note }: { user: FriendUser; note?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar user={user} size={32} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {user.name ?? user.username ?? "Lifter"}
        </span>
        <span className="block truncate font-mono text-xs text-[var(--color-muted)]">
          {user.username ? `@${user.username}` : "no username"}
          {note ? ` · ${note}` : ""}
        </span>
      </span>
    </span>
  );
}
