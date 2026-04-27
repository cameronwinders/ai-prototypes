"use client";

import { useActionState, useEffect, useRef } from "react";

import { initialLeadFormState } from "@/app/action-state";
import { submitLead } from "@/app/actions";
import { CreatorProfileFields } from "@/components/CreatorProfileFields";

export function LeadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(submitLead, initialLeadFormState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      {state.message ? (
        <div
          aria-live="polite"
          className={`rounded-[1.3rem] border px-4 py-3.5 text-sm leading-6 ${
            state.status === "success"
              ? "border-[rgba(91,77,255,0.16)] bg-[rgba(91,77,255,0.08)] text-[var(--text-primary)]"
              : "border-[rgba(46,36,110,0.18)] bg-[rgba(46,36,110,0.07)] text-[var(--text-primary)]"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <CreatorProfileFields errors={state.fieldErrors} />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(91,77,255,0.22)] hover:-translate-y-0.5 hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Submitting..." : "Request a consult and create account"}
      </button>
    </form>
  );
}
