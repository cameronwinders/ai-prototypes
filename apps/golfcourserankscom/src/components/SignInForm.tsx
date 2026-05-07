"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { requestSignInLink } from "@/app/actions";

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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const result = await requestSignInLink({
        email,
        next,
        mode
      });

      if (!result.ok) {
        setError(result.message ?? "We could not send the sign-in email.");
        setSubmitting(false);
        return;
      }

      setMessage(result.message ?? "Check your email for the secure sign-in link.");
      setSubmitting(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not send the sign-in email.");
      setSubmitting(false);
    }
  }

  return (
    <form className="min-w-0 space-y-5 overflow-x-hidden" onSubmit={onSubmit}>
      {signedOut ? <div className="pill pill-pine pill-sentence">You have been signed out.</div> : null}
      {error ? <div className="pill pill-warning pill-sentence">{error}</div> : null}
      {message ? <div className="pill pill-pine pill-sentence">{message}</div> : null}

      <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--line)] bg-white/85 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={mode === "sign-in" ? "solid-button justify-center" : "ghost-button justify-center"}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={mode === "sign-up" ? "solid-button justify-center" : "ghost-button justify-center"}
          >
            Create account
          </button>
        </div>
      </div>

      <label className="block text-sm font-medium text-[var(--ink)]">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@golfmail.com"
          className="mt-2 min-w-0 w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[rgba(49,107,83,0.45)]"
        />
      </label>

      <p className="text-sm leading-7 text-[var(--muted)]">
        {mode === "sign-up"
          ? "We will help you set your handicap band after the link opens so you can start ranking right away."
          : "We will email a secure sign-in link and bring you back to the page you started from."}
      </p>

      <button type="submit" disabled={submitting} className="solid-button w-full justify-center disabled:opacity-70">
        {submitting ? "Sending..." : mode === "sign-up" ? "Email my account link" : "Email my sign-in link"}
      </button>
    </form>
  );
}
