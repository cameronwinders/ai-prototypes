"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { requestSignInLink } from "@/app/actions";

export function SignInForm({ inviterName = null }: { inviterName?: string | null }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/rankings";
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
      {error ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--warning-line)] bg-[var(--warning-bg)] px-4 py-3 text-sm leading-7 text-[var(--warning-ink)]">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-[var(--radius-md)] border border-[rgba(49,107,83,0.18)] bg-[rgba(216,231,221,0.82)] px-4 py-3 text-sm leading-7 text-[var(--pine)]">
          {message}
        </div>
      ) : null}
      {inviterName ? (
        <div className="rounded-[var(--radius-md)] border border-[rgba(49,107,83,0.16)] bg-[rgba(216,231,221,0.72)] px-4 py-3 text-sm leading-7 text-[var(--pine)]">
          Continue to compare with <span className="font-semibold text-[var(--ink)]">{inviterName}</span> after you open the email link.
        </div>
      ) : null}

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
          placeholder="you@example.com"
          className="mt-2 min-w-0 w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[rgba(49,107,83,0.45)]"
        />
      </label>

      <p className="text-sm leading-7 text-[var(--muted)]">
        {mode === "sign-up"
          ? inviterName
            ? `We will help you set your handicap band, pick the public courses you have played, rank them, and then connect you back to ${inviterName}'s invite.`
            : "We will help you set your handicap band, track the public courses you have played, build your wish list, and start ranking."
          : "We will email a secure sign-in link and bring you back to the page you started from."}
      </p>

      <button type="submit" disabled={submitting} className="solid-button w-full justify-center disabled:opacity-70">
        {submitting ? "Sending..." : mode === "sign-up" ? "Email my account link" : "Email my sign-in link"}
      </button>
    </form>
  );
}
