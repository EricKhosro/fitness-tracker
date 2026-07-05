import Image from "next/image";
import { requireUserId, getWeightUnit } from "@/lib/dal";
import { getUserProfile } from "@/lib/queries/users";
import { signOutAction } from "@/lib/auth-actions";
import { UsernameForm } from "@/components/profile/username-form";
import { UnitToggle } from "@/components/layout/unit-toggle";

export default async function ProfilePage() {
  const userId = await requireUserId();
  const [profile, unit] = await Promise.all([
    getUserProfile(userId),
    getWeightUnit(),
  ]);
  if (!profile) return null;

  const memberSince = profile.createdAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 sm:gap-10">
      <section>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          Profile
        </h1>
        <p className="mt-1 text-[var(--color-muted)]">
          Who this logbook belongs to.
        </p>
      </section>

      <section className="sheet">
        <div className="flex items-center gap-4">
          {profile.image ? (
            <Image
              src={profile.image}
              alt={profile.name ?? "You"}
              width={64}
              height={64}
              className="rounded-[3px] border border-[var(--color-rule)]"
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{profile.name}</p>
            <p className="truncate font-mono text-xs text-[var(--color-muted)]">
              {profile.username ? `@${profile.username} · ` : ""}
              {profile.email}
            </p>
            <p className="mt-0.5 font-mono text-xs text-[var(--color-muted)]">
              Logging since {memberSince}
            </p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 divide-x divide-[var(--color-rule)] border-t border-[var(--color-rule)] pt-4">
          <div className="pr-4">
            <dd className="font-mono text-2xl font-semibold tabular-nums">
              {profile.totalExercises}
            </dd>
            <dt className="mt-0.5 font-display text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Exercises
            </dt>
          </div>
          <div className="pl-4">
            <dd className="font-mono text-2xl font-semibold tabular-nums">
              {profile.totalSets}
            </dd>
            <dt className="mt-0.5 font-display text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Sets logged
            </dt>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="ledger-title mb-3">Username</h2>
        <div className="sheet">
          <UsernameForm username={profile.username} />
        </div>
      </section>

      <section>
        <h2 className="ledger-title mb-3">Preferences</h2>
        <div className="sheet flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Weight unit</p>
            <p className="text-xs text-[var(--color-muted)]">
              How weights are shown and entered. Stored values don&apos;t change.
            </p>
          </div>
          <UnitToggle unit={unit} />
        </div>
      </section>

      <section>
        <h2 className="ledger-title mb-3">Account</h2>
        <div className="sheet flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-muted)]">
            Signed in with Google.
          </p>
          <form action={signOutAction}>
            <button type="submit" className="btn btn-ghost text-xs">
              Sign out
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
