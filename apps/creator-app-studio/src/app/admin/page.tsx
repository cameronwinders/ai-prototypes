import { AdminAccountCard } from "@/components/AdminAccountCard";
import { DashboardHeader } from "@/components/DashboardHeader";
import type { AccountRecord } from "@/lib/account-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSupabaseEnv } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/viewer";

type LeadSummary = {
  account_id: string | null;
  created_at: string;
};

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const viewer = await requireAdmin("/admin");
  const env = getServerSupabaseEnv();
  const query = (await searchParams).q?.trim().toLowerCase() ?? "";

  if (!env.hasServiceRole) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <DashboardHeader viewer={viewer} />
          <section className="mt-6 surface-card rounded-[2rem] p-7 sm:p-9">
            <h1 className="brand-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
              Admin mode is not configured here yet.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
              This environment is missing the service role key that powers account-wide admin access.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const admin = createAdminClient();
  const { data: accountsData } = await admin
    .from("accounts")
    .select("*")
    .order("updated_at", { ascending: false })
    .returns<AccountRecord[]>();
  const { data: leadsData } = await admin
    .from("leads")
    .select("account_id, created_at")
    .order("created_at", { ascending: false })
    .returns<LeadSummary[]>();

  const leadStats = new Map<string, { count: number; lastLeadAt: string | null }>();

  for (const lead of leadsData ?? []) {
    if (!lead.account_id) {
      continue;
    }

    const existing = leadStats.get(lead.account_id) ?? { count: 0, lastLeadAt: null };
    existing.count += 1;
    existing.lastLeadAt = existing.lastLeadAt ?? lead.created_at;
    leadStats.set(lead.account_id, existing);
  }

  const filteredAccounts = (accountsData ?? []).filter((account) => {
    if (!query) {
      return true;
    }

    const haystack = [
      account.email,
      account.name ?? "",
      account.brand_name ?? "",
      account.creator_handle ?? ""
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader viewer={viewer} />

        <section className="mt-6 surface-card rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-dark)]">
                Admin
              </p>
              <h1 className="brand-display mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-[3rem]">
                Creator accounts and shared demos
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
                Search accounts, review lead activity, and assign or update the primary demo link each creator sees in their account.
              </p>
            </div>

            <form className="w-full max-w-md">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Search creators
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search by name, brand, email, or handle"
                  className="mt-2 w-full rounded-[1.1rem] border border-[rgba(23,20,17,0.1)] bg-white/90 px-4 py-3.5 text-sm text-[var(--text-primary)]"
                />
              </label>
            </form>
          </div>
        </section>

        <section className="mt-6 space-y-5">
          {filteredAccounts.length ? (
            filteredAccounts.map((account) => {
              const stats = leadStats.get(account.id) ?? { count: 0, lastLeadAt: null };

              return (
                <AdminAccountCard
                  key={account.id}
                  account={account}
                  leadCount={stats.count}
                  lastLeadAt={stats.lastLeadAt}
                />
              );
            })
          ) : (
            <div className="surface-card rounded-[1.8rem] p-6 text-sm text-[var(--text-secondary)]">
              No accounts match that search yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
