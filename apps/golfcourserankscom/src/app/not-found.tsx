import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell-panel rounded-[2.4rem] p-6 sm:p-8">
      <p className="section-label">Page not found</p>
      <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
        That page is out of bounds.
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
        The link may be old, or the page may have moved while the national board kept growing. Use one of the quick routes below to get back into the app.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/leaderboard" className="solid-button min-h-11">
          Open leaderboard
        </Link>
        <Link href="/courses" className="ghost-button min-h-11">
          Browse courses
        </Link>
        <Link href="/" className="ghost-button min-h-11">
          Back to home
        </Link>
      </div>
    </div>
  );
}
