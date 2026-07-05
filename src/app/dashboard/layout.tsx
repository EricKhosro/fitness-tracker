import Link from "next/link";
import Image from "next/image";
import { getSession, getWeightUnit } from "@/lib/dal";
import { redirect } from "next/navigation";
import { NavLinks } from "@/components/layout/nav-links";
import { UnitToggle } from "@/components/layout/unit-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/");
  }
  const { name, image } = session.user;
  const unit = await getWeightUnit();

  return (
    <div className="min-h-dvh">
      <header className="rule-double sticky top-0 z-10 bg-[var(--color-paper)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/dashboard"
              className="font-display text-xl font-bold uppercase leading-none tracking-tight"
            >
              Rep<span className="text-[var(--color-green)]">Log</span>
            </Link>
            <NavLinks />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <UnitToggle unit={unit} />
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2"
              aria-label="Your profile"
            >
              <span className="hidden text-sm text-[var(--color-muted)] sm:inline">
                {name}
              </span>
              {image ? (
                <Image
                  src={image}
                  alt={name ?? "You"}
                  width={32}
                  height={32}
                  className="rounded-[3px] border border-[var(--color-rule)]"
                />
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
