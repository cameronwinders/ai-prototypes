"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { initialLeadFormState, type LeadSubmitState } from "@/app/action-state";
import { submitLead } from "@/app/actions";
import { CreatorProfileFields } from "@/components/CreatorProfileFields";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv, getSiteUrl } from "@/lib/supabase/env";

type AccessLinkState = {
  status: "idle" | "sending" | "sent" | "error";
  message?: string;
};

export function LeadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(submitLead, initialLeadFormState);
  const [accessLinkState, setAccessLinkState] = useState<AccessLinkState>({
    status: "idle"
  });

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  useEffect(() => {
    let cancelled = false;

    async function sendAccessLink(successState: LeadSubmitState) {
      if (successState.status !== "success" || !successState.accountEmail) {
        return;
      }

      const env = getPublicSupabaseEnv();

      if (!env.isConfigured) {
        if (!cancelled) {
          setAccessLinkState({
            status: "error",
            message:
              "Your idea was saved, but account email delivery is not configured in this environment."
          });
        }
        return;
      }

      if (!cancelled) {
        setAccessLinkState({
          status: "sending",
          message: "Sending your secure account link..."
        });
      }

      try {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.auth.signInWithOtp({
          email: successState.accountEmail,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: `${getSiteUrl()}/api/auth/callback?next=${encodeURIComponent("/account")}`
          }
        });

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setAccessLinkState({
            status: "sent",
            message: `Your secure account link has been sent to ${successState.accountEmail}.`
          });
        }
      } catch (error) {
        console.error("Creator App Studio lead form link delivery failed", error);

        if (!cancelled) {
          setAccessLinkState({
            status: "error",
            message:
              "Your idea was saved and your account is ready, but we could not send the sign-in email just now. Please use the sign-in page in a moment."
          });
        }
      }
    }

    void sendAccessLink(state);

    return () => {
      cancelled = true;
    };
  }, [state]);

  const visibleMessage = accessLinkState.status !== "idle" ? accessLinkState.message : state.message;
  const visibleStatus = accessLinkState.status === "error" ? "error" : state.status;

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      {visibleMessage ? (
        <div
          aria-live="polite"
          className={`rounded-[1.3rem] border px-4 py-3.5 text-sm leading-6 ${
            visibleStatus === "success"
              ? "border-[rgba(91,77,255,0.16)] bg-[rgba(91,77,255,0.08)] text-[var(--text-primary)]"
              : "border-[rgba(46,36,110,0.18)] bg-[rgba(46,36,110,0.07)] text-[var(--text-primary)]"
          }`}
        >
          {visibleMessage}
        </div>
      ) : null}

      <CreatorProfileFields errors={state.fieldErrors} />

      <button
        type="submit"
        disabled={pending || accessLinkState.status === "sending"}
        className="inline-flex w-full items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(91,77,255,0.22)] hover:-translate-y-0.5 hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending || accessLinkState.status === "sending"
          ? "Preparing account..."
          : "Request a consult and create account"}
      </button>
    </form>
  );
}
