import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import { signInWithGoogle } from "@/lib/auth-actions";
import { GoogleIcon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const SAMPLE_ROWS = [
  { name: "Bench Press", figures: "100 kg × 5", pr: true },
  { name: "Overhead Press", figures: "60 kg × 8", pr: false },
  { name: "Dip", figures: "+25 kg × 10", pr: false },
];

const FEATURES = [
  {
    title: "Log fast",
    body: "Weight, reps, done. Two taps between sets, with a rest timer that starts itself.",
  },
  {
    title: "See progress",
    body: "Top weight, volume and estimated 1RM, charted per exercise, session by session.",
  },
  {
    title: "Keep it yours",
    body: "Your log is scoped to your account. Nobody else reads your numbers.",
  },
];

export default async function Home() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center px-6 py-14 sm:py-20">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-[var(--color-ink)]" />
          <span className="eyebrow text-[var(--color-ink)]">
            Training logbook
          </span>
          <span className="h-px flex-1 bg-[var(--color-ink)]" />
        </div>

        <h1 className="mt-8 text-center font-display text-7xl font-bold uppercase leading-none tracking-tight sm:text-8xl">
          Rep<span className="text-[var(--color-green)]">Log</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-center text-lg text-[var(--color-muted)]">
          Weights, reps, dates — written down every session, so you can see the
          bar going up.
        </p>

        <div className="mt-8 flex justify-center">
          <form action={signInWithGoogle}>
            <button type="submit" className="btn btn-ink px-6 py-3 text-base">
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </button>
          </form>
        </div>

        <div className="sheet mt-14 p-0 sm:p-0">
          <div className="flex items-baseline justify-between border-b border-[var(--color-rule)] px-4 py-2.5 sm:px-5">
            <span className="eyebrow">Sample page</span>
            <span className="font-mono text-xs text-[var(--color-muted)]">
              PUSH DAY
            </span>
          </div>
          <ul>
            {SAMPLE_ROWS.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between gap-3 border-b border-[var(--color-rule-soft)] px-4 py-3 last:border-b-0 sm:px-5"
              >
                <span className="font-medium">{row.name}</span>
                <span className="flex items-center gap-2 font-mono text-sm">
                  {row.pr ? (
                    <>
                      <span className="pr-ring">{row.figures}</span>
                      <span className="ink-note">PR</span>
                    </>
                  ) : (
                    row.figures
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-12 border-t border-[var(--color-rule)]">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="flex flex-col gap-1 border-b border-[var(--color-rule)] py-4 sm:flex-row sm:items-baseline sm:gap-6"
            >
              <span className="w-36 shrink-0 font-display text-sm font-semibold uppercase tracking-[0.14em]">
                {f.title}
              </span>
              <span className="text-sm text-[var(--color-muted)]">{f.body}</span>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center font-mono text-xs uppercase tracking-wider text-[var(--color-muted)]">
          Free to use · kg / lb
        </p>
      </div>
    </main>
  );
}
