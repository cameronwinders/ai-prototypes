"use client";

import { useActionState } from "react";

import { initialAccountFormState } from "@/app/action-state";
import { updateAccountProfile } from "@/app/actions";
import { CreatorProfileFields } from "@/components/CreatorProfileFields";
import type { AccountRecord } from "@/lib/account-service";

export function AccountProfileForm({ account }: { account: AccountRecord }) {
  const [state, formAction, pending] = useActionState(updateAccountProfile, initialAccountFormState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
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

      <CreatorProfileFields
        emailMode="readonly"
        errors={state.fieldErrors}
        values={{
          name: account.name ?? "",
          email: account.email,
          brand_name: account.brand_name ?? "",
          creator_handle: account.creator_handle ?? "",
          primary_platform: account.primary_platform ?? "",
          audience_size_range: account.audience_size_range ?? "",
          niche: account.niche ?? "",
          current_monetization: account.current_monetization ?? "",
          rough_app_idea: account.rough_app_idea ?? ""
        }}
      />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(91,77,255,0.22)] hover:-translate-y-0.5 hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
