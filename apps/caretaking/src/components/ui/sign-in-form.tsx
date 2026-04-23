"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/supabase/env";

export function SignInForm({ signedOut = false }: { signedOut?: boolean }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/spaces";
  const isInviteSignIn = next.startsWith("/accept-invite");
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">(isInviteSignIn ? "sign-up" : "sign-in");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const isSignUp = authMode === "sign-up" || isInviteSignIn;

  function getFriendlyAuthError(message: string) {
    const normalized = message.toLowerCase();

    if (normalized.includes("signup") || normalized.includes("signups not allowed")) {
      return "We could not create an account with that email right now. If you were invited, use the same email from your invite or ask the space owner to resend it.";
    }

    if (normalized.includes("rate limit")) {
      return "Too many email links were requested. Please wait a few minutes before trying again.";
    }

    if (normalized.includes("email")) {
      return "We could not send the email link. Please check the address and try again.";
    }

    return "Something went wrong sending your secure link. Please try again.";
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSent(false);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${getSiteUrl()}/api/auth/callback?next=${encodeURIComponent(next)}`,
        shouldCreateUser: isSignUp
      }
    });

    if (signInError) {
      setError(getFriendlyAuthError(signInError.message));
      setSubmitting(false);
    } else {
      setMessage(isSignUp ? "Check your email for your account link." : "Check your email for the sign-in link.");
      setSent(true);
    }
  }

  return (
    <form className="stack-card auth-card" onSubmit={onSubmit}>
      {signedOut && !isSignUp ? <div className="banner success-text">You have been logged out.</div> : null}
      <div className="section-header">
        <h2>{isSignUp ? "Create your account" : "Sign in"}</h2>
        <p className="muted">
          {isSignUp
            ? "Create your account with a secure email link."
            : "We'll email you a secure sign-in link."}
        </p>
      </div>
      {!isInviteSignIn ? (
        <div className="auth-mode-toggle" aria-label="Choose sign in or sign up">
          <button
            aria-pressed={authMode === "sign-in"}
            className={authMode === "sign-in" ? "is-active" : ""}
            onClick={() => {
              setAuthMode("sign-in");
              setError(null);
              setMessage(null);
              setSent(false);
            }}
            type="button"
          >
            Sign in
          </button>
          <button
            aria-pressed={authMode === "sign-up"}
            className={authMode === "sign-up" ? "is-active" : ""}
            onClick={() => {
              setAuthMode("sign-up");
              setError(null);
              setMessage(null);
              setSent(false);
            }}
            type="button"
          >
            Create account
          </button>
        </div>
      ) : null}
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSent(false);
            setSubmitting(false);
          }}
          placeholder="you@example.com"
          required
        />
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      {message ? <p className="success-text">{message}</p> : null}
      <button className="button button-primary button-full" type="submit" disabled={submitting || sent}>
        {submitting ? "Sending..." : sent ? "Email sent" : isSignUp ? "Send account link" : "Send sign-in link"}
      </button>
    </form>
  );
}
