import { SignInForm } from "@/components/SignInForm";
import { getViewerContext } from "@/lib/viewer";

export default async function SignInPage() {
  const viewer = await getViewerContext();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="surface-card rounded-[1.6rem] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/"
              className="brand-display text-lg font-semibold tracking-[-0.04em] text-[var(--text-primary)]"
            >
              Creator App Studio
            </a>
            <div className="flex items-center gap-2">
              {viewer.user ? (
                <a
                  href={viewer.isAdmin ? "/admin" : "/account"}
                  className="rounded-full border border-[rgba(91,77,255,0.18)] bg-[rgba(91,77,255,0.08)] px-4 py-2 text-sm font-semibold text-[var(--accent-dark)]"
                >
                  Open {viewer.isAdmin ? "admin" : "account"}
                </a>
              ) : null}
              <a
                href="/#contact"
                className="rounded-full border border-[rgba(23,20,17,0.08)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
              >
                Submit your idea
              </a>
            </div>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="surface-card rounded-[2rem] p-7 sm:p-9">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-dark)]">
              Secure account access
            </p>
            <h1 className="brand-display mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-[3.4rem]">
              Review your project profile and any shared demos.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
              Use a secure email link to access your account. Once you are in, you can update your creator profile and open any demo experience we have shared with you.
            </p>
            <div className="mt-8 grid gap-3">
              {[
                "No password to remember.",
                "The same account works whether you signed up directly or submitted the landing form.",
                "Admins can also use this flow to review every creator account."
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.2rem] border border-[rgba(23,20,17,0.08)] bg-white/72 px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6 sm:p-8">
            <div className="mx-auto max-w-xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-dark)]">
                Sign in
              </p>
              <h2 className="brand-display mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                Open your workspace
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
                Start with your email and we will send the secure link from there.
              </p>
              <div className="mt-8">
                <SignInForm />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
