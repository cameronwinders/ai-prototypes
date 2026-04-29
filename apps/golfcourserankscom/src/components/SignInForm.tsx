"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv, getSiteUrl } from "@/lib/supabase/env";

export function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/leaderboard";
  const signedOut = searchParams.get("signed_out") === "1";
  const callbackError = searchParams.get("error");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(callbackError);
  const env = getPublicSupabaseEnv();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    if (!env.isConfigured) {
      setError("Supabase email sign-in is not configured for this environment yet.");
      setSubmitting(false);
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === "sign-up",
          emailRedirectTo: `${getSiteUrl()}/api/auth/callback?next=${encodeURIComponent(next)}`
        }
      });

      if (authError) {
        setError(authError.message);
        setSubmitting(false);
        return;
      }

      setMessage(
        mode === "sign-up"
          ? "Check your email for the account link. After the callback we will capture your handicap band and return you to the page you started from."
          : "Check your email for the secure sign-in link."
      );
      setSubmitting(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not send the sign-in email.");
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {signedOut ? (
        <div className="rounded-[1.4rem] border border-[rgba(49,107,83,0.16)] bg-[rgba(49,107,83,0.08)] px-4 py-3 text-sm text-[var(--ink)]">
          You have been signed out.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.4rem] border border-[rgba(126,58,58,0.14)] bg-[rgba(126,58,58,0.08)] px-4 py-3 text-sm text-[var(--ink)]">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-[1.4rem] border border-[rgba(49,107,83,0.16)] bg-[rgba(49,107,83,0.08)] px-4 py-3 text-sm text-[var(--ink)]">
          {message}
        </div>
      ) : null}

      <div className="rounded-full border border-[var(--line)] bg-white/85 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold ${
              mode === "sign-in" ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold ${
              mode === "sign-up" ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"
            }`}
          >
            Create account
          </button>
        </div>
      </div>

      <label className="block text-sm font-semibold text-[var(--ink)]">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@golfmail.com"
          className="mt-2 w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[rgba(49,107,83,0.45)]"
        />
      </label>

      <p className="text-sm leading-6 text-[var(--muted)]">
        {mode === "sign-up"
          ? "Phase 1 onboarding stays minimal. We only ask for your handicap band after the magic link."
          : "Your played courses, ranking order, and compare access all reopen as soon as the link completes the session."}
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(24,37,43,0.18)] disabled:opacity-70"
      >
        {submitting ? "Sending..." : mode === "sign-up" ? "Email my account link" : "Email my sign-in link"}
      </button>
    </form>
  );
}
