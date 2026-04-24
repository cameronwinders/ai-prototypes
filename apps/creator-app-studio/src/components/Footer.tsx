import { navLinks } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 rounded-[1.75rem] border border-[rgba(23,20,17,0.08)] bg-white/70 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="brand-display text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              Creator App Studio
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Premium branded web apps for creators who want a product their audience can
              actually pay for and return to.
            </p>
          </div>

          <nav className="flex flex-wrap gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              className="text-sm font-semibold text-[var(--accent-dark)] hover:text-[var(--accent)]"
            >
              Request a consult
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
