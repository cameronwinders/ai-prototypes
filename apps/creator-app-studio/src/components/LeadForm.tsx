"use client";

import { useActionState, useEffect, useRef } from "react";

import { initialLeadFormState, submitLead } from "@/app/actions";
import { audienceSizeOptions, platformOptions } from "@/lib/constants";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-[var(--accent-dark)]">{message}</p>;
}

function inputClasses(hasError: boolean) {
  return [
    "mt-2 w-full rounded-[1.1rem] border bg-white/90 px-4 py-3.5 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-colors",
    hasError
      ? "border-[rgba(91,77,255,0.5)]"
      : "border-[rgba(23,20,17,0.1)] hover:border-[rgba(91,77,255,0.24)]"
  ].join(" ");
}

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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Name
          <input
            name="name"
            type="text"
            required
            className={inputClasses(Boolean(state.fieldErrors?.name))}
            placeholder="Your name"
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          <FieldError message={state.fieldErrors?.name} />
        </label>

        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Email
          <input
            name="email"
            type="email"
            required
            className={inputClasses(Boolean(state.fieldErrors?.email))}
            placeholder="you@brand.com"
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          <FieldError message={state.fieldErrors?.email} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Brand name
          <input
            name="brand_name"
            type="text"
            className={inputClasses(Boolean(state.fieldErrors?.brand_name))}
            placeholder="Optional"
            aria-invalid={Boolean(state.fieldErrors?.brand_name)}
          />
          <FieldError message={state.fieldErrors?.brand_name} />
        </label>

        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Creator handle
          <input
            name="creator_handle"
            type="text"
            className={inputClasses(Boolean(state.fieldErrors?.creator_handle))}
            placeholder="@yourhandle"
            aria-invalid={Boolean(state.fieldErrors?.creator_handle)}
          />
          <FieldError message={state.fieldErrors?.creator_handle} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Primary platform
          <select
            name="primary_platform"
            className={inputClasses(Boolean(state.fieldErrors?.primary_platform))}
            defaultValue=""
            aria-invalid={Boolean(state.fieldErrors?.primary_platform)}
          >
            <option value="">Select if relevant</option>
            {platformOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.primary_platform} />
        </label>

        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Audience size
          <select
            name="audience_size_range"
            className={inputClasses(Boolean(state.fieldErrors?.audience_size_range))}
            defaultValue=""
            aria-invalid={Boolean(state.fieldErrors?.audience_size_range)}
          >
            <option value="">Select if relevant</option>
            {audienceSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.audience_size_range} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Niche
          <input
            name="niche"
            type="text"
            className={inputClasses(Boolean(state.fieldErrors?.niche))}
            placeholder="Fitness, faith, career, home, or another niche"
            aria-invalid={Boolean(state.fieldErrors?.niche)}
          />
          <FieldError message={state.fieldErrors?.niche} />
        </label>

        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Current monetization
          <input
            name="current_monetization"
            type="text"
            className={inputClasses(Boolean(state.fieldErrors?.current_monetization))}
            placeholder="Courses, coaching, memberships, sponsors"
            aria-invalid={Boolean(state.fieldErrors?.current_monetization)}
          />
          <FieldError message={state.fieldErrors?.current_monetization} />
        </label>
      </div>

      <label className="block text-sm font-medium text-[var(--text-primary)]">
        Rough app idea
        <textarea
          name="rough_app_idea"
          rows={5}
          className={inputClasses(Boolean(state.fieldErrors?.rough_app_idea))}
          placeholder="What would feel valuable for your audience? A challenge, a dashboard, a companion tool, a planning experience, or something else."
          aria-invalid={Boolean(state.fieldErrors?.rough_app_idea)}
        />
        <FieldError message={state.fieldErrors?.rough_app_idea} />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(91,77,255,0.22)] hover:-translate-y-0.5 hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Submitting..." : "Request a consult"}
      </button>
    </form>
  );
}
