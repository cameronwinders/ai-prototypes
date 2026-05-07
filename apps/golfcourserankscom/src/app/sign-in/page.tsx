import { SignInForm } from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <div className="grid min-w-0 gap-6 overflow-x-hidden xl:grid-cols-[0.92fr_1.08fr]">
      <section className="shell-panel min-w-0 p-6 sm:p-8">
        <p className="eyebrow">SIGN IN</p>
        <h1 className="h2 mt-4">The ranking list only real golfers can build</h1>
        <p className="subhed mt-4">
          Sign in with your email, set your handicap band, and start ranking the public courses you know best.
        </p>
        <div className="mt-8 grid gap-3">
          {[
            "The national leaderboard is built from real golfer comparisons, not star ratings.",
            "Mark played courses, rank them in order, and compare with friends you trust.",
            "Feedback and course requests are always one tap away."
          ].map((item) => (
            <div key={item} className="rounded-[var(--radius-md)] border border-[rgba(24,37,43,0.08)] bg-white/85 px-4 py-3 text-sm leading-7 text-[var(--muted)]">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="shell-panel-contrast min-w-0 p-6 sm:p-8">
        <p className="eyebrow">ONE-TAP EMAIL SIGN-IN</p>
        <h2 className="h3 mt-4">Email yourself the secure link</h2>
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
