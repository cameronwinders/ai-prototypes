"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv, getSiteUrl } from "@/lib/supabase/env";

export function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const queryError = searchParams.get("error");
  const signedOut = searchParams.get("signed_out") === "1";
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(queryError);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const env = getPublicSupabaseEnv();

  function getFriendlyError(input: string) {
    const normalized = input.toLowerCase();

    if (normalized.includes("signup") || normalized.includes("signups not allowed")) {
      return "We could not open an account from that email just yet. If you already submitted your idea, try the sign-in option instead.";
    }

    if (normalized.includes("rate limit")) {
      return "Too many email links were requested. Please wait a few minutes and try again.";
    }

    if (normalized.includes("email")) {
      return "We could not send the sign-in email. Please check the address and try again.";
    }

    return "Something went wrong sending your secure link. Please try again.";
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSent(false);
    setError(null);
    setMessage(null);

    if (!env.isConfigured) {
      setError("Sign-in is not configured in this environment yet.");
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
        setError(getFriendlyError(authError.message));
        setSubmitting(false);
        return;
      }

      setMessage(
        mode === "sign-up"
          ? "Check your email for your account access link."
          : "Check your email for your secure sign-in link."
      );
      setSent(true);
      setSubmitting(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? getFriendlyError(caught.message)
          : "We could not send the sign-in email."
      );
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {signedOut ? (
        <div className="rounded-[1.3rem] border border-[rgba(91,77,255,0.16)] bg-[rgba(91,77,255,0.08)] px-4 py-3.5 text-sm text-[var(--text-primary)]">
          You have been signed out.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.3rem] border border-[rgba(46,36,110,0.18)] bg-[rgba(46,36,110,0.07)] px-4 py-3.5 text-sm text-[var(--text-primary)]">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-[1.3rem] border border-[rgba(91,77,255,0.16)] bg-[rgba(91,77,255,0.08)] px-4 py-3.5 text-sm text-[var(--text-primary)]">
          {message}
        </div>
      ) : null}

      <div className="rounded-full border border-[rgba(23,20,17,0.08)] bg-white/70 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            aria-pressed={mode === "sign-in"}
            onClick={() => {
              setMode("sign-in");
              setError(null);
              setMessage(null);
            }}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold ${
              mode === "sign-in"
                ? "bg-[var(--text-primary)] text-white"
                : "text-[var(--text-secondary)]"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            aria-pressed={mode === "sign-up"}
            onClick={() => {
              setMode("sign-up");
              setError(null);
              setMessage(null);
            }}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold ${
              mode === "sign-up"
                ? "bg-[var(--text-primary)] text-white"
                : "text-[var(--text-secondary)]"
            }`}
          >
            Create account
          </button>
        </div>
      </div>

      <label className="block text-sm font-medium text-[var(--text-primary)]">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="you@brand.com"
          className="mt-2 w-full rounded-[1.1rem] border border-[rgba(23,20,17,0.1)] bg-white/90 px-4 py-3.5 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
        />
      </label>

      <p className="text-sm leading-6 text-[var(--text-secondary)]">
        {mode === "sign-up"
          ? "We will email you a secure link to open your account. No password needed."
          : "We will email you a secure link to access your account and any shared demo links."}
      </p>

      <button
        type="submit"
        disabled={submitting || sent}
        className="inline-flex w-full items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(91,77,255,0.22)] hover:-translate-y-0.5 hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Sending..." : sent ? "Email sent" : mode === "sign-up" ? "Send account link" : "Send sign-in link"}
      </button>
    </form>
  );
}
