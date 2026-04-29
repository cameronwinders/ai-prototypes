import { SignInForm } from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <section className="glass-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Sign in</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Build your public-course pecking order.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          Phase 1 keeps the profile minimal: log in, pick a handicap band, and start dragging your played courses into order.
        </p>
        <div className="mt-8 grid gap-3">
          {[
            "National leaderboard only, so every ranking signal feeds one shared board.",
            "Only public courses from the curated shortlist count in Phase 1.",
            "Feedback is always one tap away if the product feels off."
          ].map((item) => (
            <div key={item} className="rounded-[1.5rem] border border-[rgba(24,37,43,0.08)] bg-white/85 px-4 py-3 text-sm leading-6 text-[var(--muted)]">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Magic-link access</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
          Email yourself the secure link.
        </h2>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          No password. The callback will open a session, create your golfer profile, and send first-time users to handicap-band onboarding.
        </p>
        <div className="mt-8">
          <SignInForm />
        </div>
      </section>
    </div>
  );
}
