import Link from "next/link";

// Shown by the service worker when a navigation fails without a connection.
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex items-center gap-4">
        <span className="h-px w-10 bg-[var(--color-ink)]" />
        <span className="eyebrow text-[var(--color-ink)]">Offline</span>
        <span className="h-px w-10 bg-[var(--color-ink)]" />
      </div>
      <h1 className="mt-6 font-display text-4xl font-bold uppercase tracking-tight sm:text-5xl">
        No connection
      </h1>
      <p className="mt-3 max-w-sm text-[var(--color-muted)]">
        RepLog needs a connection to write to the log. Your data is safe —
        reconnect and pick up where you left off.
      </p>
      <Link href="/dashboard" className="btn btn-primary mt-8">
        Try again
      </Link>
    </main>
  );
}
