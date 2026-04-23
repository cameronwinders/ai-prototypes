import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { SignInForm } from "@/components/ui/sign-in-form";

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const signedOut = params.signedOut === "1";

  return (
    <AppShell
      title="Shared care, calmly coordinated."
      subtitle="Sign in with email to log updates, check reminders, and stay in sync."
      eyebrow="Caretaking App"
    >
      <div className="auth-grid">
        <section className="auth-pitch">
          <div className="floating-card">
            <p className="eyebrow">Today</p>
            <h2>Log once. Everyone sees it.</h2>
            <p className="muted">Built for shared caregiving moments that need to be fast, clear, and trustworthy.</p>
          </div>
          <div className="trust-row">
            <span>Private spaces</span>
            <span>Shared timeline</span>
            <span>Simple reminders</span>
          </div>
        </section>
        <section>
          <Suspense>
            <SignInForm signedOut={signedOut} />
          </Suspense>
        </section>
      </div>
    </AppShell>
  );
}
