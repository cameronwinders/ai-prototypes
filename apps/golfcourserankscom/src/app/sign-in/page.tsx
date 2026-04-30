import { SignInForm } from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <section className="shell-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Sign in</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Start your personal public-course ranking.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          Sign in with your email, set your handicap band, and start ranking the public courses you know best.
        </p>
        <div className="mt-8 grid gap-3">
          {[
            "The national leaderboard is built from real golfer comparisons, not star ratings.",
            "Mark played courses, rank them in order, and compare with friends you trust.",
            "Feedback and course requests are always one tap away."
          ].map((item) => (
            <div key={item} className="rounded-[1.5rem] border border-[rgba(24,37,43,0.08)] bg-white/85 px-4 py-3 text-sm leading-6 text-[var(--muted)]">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="shell-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">One-tap email sign-in</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
          Email yourself the secure link.
        </h2>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          No password required. Open the link from your inbox and we will bring you right back to the page you started from.
        </p>
        <div className="mt-8">
          <SignInForm />
        </div>
      </section>
    </div>
  );
}
