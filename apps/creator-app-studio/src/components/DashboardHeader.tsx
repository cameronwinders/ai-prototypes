import { signOut } from "@/app/actions";
import type { ViewerContext } from "@/lib/viewer";

export function DashboardHeader({ viewer }: { viewer: ViewerContext }) {
  return (
    <header className="px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="surface-card rounded-[1.6rem] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <a
                href="/"
                className="brand-display text-lg font-semibold tracking-[-0.04em] text-[var(--text-primary)]"
              >
                Creator App Studio
              </a>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {viewer.isAdmin
                  ? "Admin view for creator accounts and shared demos."
                  : "Your profile, access links, and project updates in one place."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/account"
                className="rounded-full border border-[rgba(23,20,17,0.08)] bg-white/80 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
              >
                Account
              </a>
              {viewer.isAdmin ? (
                <a
                  href="/admin"
                  className="rounded-full border border-[rgba(91,77,255,0.18)] bg-[rgba(91,77,255,0.08)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-dark)]"
                >
                  Admin
                </a>
              ) : null}
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-[rgba(23,20,17,0.08)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
