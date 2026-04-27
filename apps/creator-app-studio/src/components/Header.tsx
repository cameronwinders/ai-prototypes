import { navLinks } from "@/lib/constants";
import { getViewerContext } from "@/lib/viewer";

const linkClasses =
  "text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]";
const ctaClasses =
  "inline-flex items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(91,77,255,0.22)] hover:-translate-y-0.5 hover:bg-[var(--accent-dark)]";

export async function Header() {
  const viewer = await getViewerContext();
  const accountHref = viewer.user ? (viewer.isAdmin ? "/admin" : "/account") : "/sign-in";
  const accountLabel = viewer.user ? (viewer.isAdmin ? "Open admin" : "Open account") : "Sign in";

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="surface-card rounded-full px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <a
              href="#top"
              className="brand-display text-lg font-semibold tracking-[-0.04em] text-[var(--text-primary)]"
            >
              Creator App Studio
            </a>

            <nav className="hidden items-center gap-6 xl:flex">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className={linkClasses}>
                  {link.label}
                </a>
              ))}
              <a href={accountHref} className={linkClasses}>
                {accountLabel}
              </a>
              <a href="#contact" className={ctaClasses}>
                Submit your idea
              </a>
            </nav>

            <details className="relative xl:hidden">
              <summary className="rounded-full border border-[rgba(23,20,17,0.08)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">
                Menu
              </summary>
              <div className="surface-card absolute right-0 mt-3 flex min-w-56 flex-col gap-2 rounded-[1.25rem] p-3">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[rgba(91,77,255,0.08)] hover:text-[var(--text-primary)]"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href={accountHref}
                  className="rounded-2xl px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[rgba(91,77,255,0.08)] hover:text-[var(--text-primary)]"
                >
                  {accountLabel}
                </a>
                <a href="#contact" className={ctaClasses}>
                  Submit your idea
                </a>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}
