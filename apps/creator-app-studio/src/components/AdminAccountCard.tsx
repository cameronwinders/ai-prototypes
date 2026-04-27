"use client";

import { useActionState } from "react";

import { initialAdminAccountFormState } from "@/app/action-state";
import { updateAdminAccount } from "@/app/actions";
import type { AccountRecord } from "@/lib/account-service";
import { demoStatusOptions } from "@/lib/constants";

function fieldClass(hasError: boolean) {
  return [
    "mt-2 w-full rounded-[1rem] border bg-white/90 px-4 py-3 text-sm text-[var(--text-primary)]",
    hasError
      ? "border-[rgba(91,77,255,0.5)]"
      : "border-[rgba(23,20,17,0.1)] hover:border-[rgba(91,77,255,0.24)]"
  ].join(" ");
}

export function AdminAccountCard({
  account,
  leadCount,
  lastLeadAt
}: {
  account: AccountRecord;
  leadCount: number;
  lastLeadAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateAdminAccount,
    initialAdminAccountFormState
  );

  return (
    <article className="surface-card rounded-[1.7rem] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="brand-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              {account.brand_name || account.name || account.email}
            </h2>
            <span className="rounded-full border border-[rgba(23,20,17,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              {account.role}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{account.email}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-[rgba(91,77,255,0.18)] bg-[rgba(91,77,255,0.08)] px-3 py-1 text-xs font-semibold text-[var(--accent-dark)]">
              Account active
            </span>
            {leadCount > 0 ? (
              <span className="rounded-full border border-[rgba(23,20,17,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                Lead submitted{leadCount > 1 ? ` (${leadCount})` : ""}
              </span>
            ) : null}
            {account.primary_demo_url ? (
              <span className="rounded-full border border-[rgba(23,20,17,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                Demo assigned
              </span>
            ) : null}
          </div>
          {lastLeadAt ? (
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Last lead activity {new Date(lastLeadAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>

        <div className="rounded-[1.3rem] border border-[rgba(23,20,17,0.08)] bg-white/72 px-4 py-3 text-sm text-[var(--text-secondary)]">
          <p className="font-semibold text-[var(--text-primary)]">
            {account.name || "Unnamed creator"}
          </p>
          <p className="mt-1">Platform: {account.primary_platform || "Not set"}</p>
          <p className="mt-1">Audience: {account.audience_size_range || "Not set"}</p>
        </div>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="account_id" value={account.id} />

        {state.message ? (
          <div
            className={`rounded-[1.2rem] border px-4 py-3 text-sm ${
              state.status === "success"
                ? "border-[rgba(91,77,255,0.16)] bg-[rgba(91,77,255,0.08)] text-[var(--text-primary)]"
                : "border-[rgba(46,36,110,0.18)] bg-[rgba(46,36,110,0.07)] text-[var(--text-primary)]"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            Primary demo URL
            <input
              name="primary_demo_url"
              type="url"
              defaultValue={account.primary_demo_url ?? ""}
              placeholder="https://demo.example.com"
              className={fieldClass(Boolean(state.fieldErrors?.primary_demo_url))}
            />
            {state.fieldErrors?.primary_demo_url ? (
              <p className="mt-2 text-sm text-[var(--accent-dark)]">
                {state.fieldErrors.primary_demo_url}
              </p>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-[var(--text-primary)]">
            Demo label
            <input
              name="demo_label"
              type="text"
              defaultValue={account.demo_label ?? ""}
              placeholder="Founder preview"
              className={fieldClass(Boolean(state.fieldErrors?.demo_label))}
            />
            {state.fieldErrors?.demo_label ? (
              <p className="mt-2 text-sm text-[var(--accent-dark)]">{state.fieldErrors.demo_label}</p>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-[var(--text-primary)]">
            Demo status
            <select
              name="demo_status"
              defaultValue={account.demo_status}
              className={fieldClass(Boolean(state.fieldErrors?.demo_status))}
            >
              {demoStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.demo_status ? (
              <p className="mt-2 text-sm text-[var(--accent-dark)]">
                {state.fieldErrors.demo_status}
              </p>
            ) : null}
          </label>
        </div>

        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Internal notes
          <textarea
            name="admin_notes"
            rows={4}
            defaultValue={account.admin_notes ?? ""}
            placeholder="Notes for rollout, follow-up, or demo handoff."
            className={fieldClass(Boolean(state.fieldErrors?.admin_notes))}
          />
          {state.fieldErrors?.admin_notes ? (
            <p className="mt-2 text-sm text-[var(--accent-dark)]">{state.fieldErrors.admin_notes}</p>
          ) : null}
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(91,77,255,0.22)] hover:-translate-y-0.5 hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Saving..." : "Save admin updates"}
        </button>
      </form>
    </article>
  );
}
