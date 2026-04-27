import { AccountProfileForm } from "@/components/AccountProfileForm";
import { DashboardHeader } from "@/components/DashboardHeader";
import { accountNeedsDemo } from "@/lib/account-service";
import { requireViewer } from "@/lib/viewer";

export default async function AccountPage() {
  const viewer = await requireViewer("/account");

  if (!viewer.account) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <DashboardHeader viewer={viewer} />
          <section className="mt-6 surface-card rounded-[2rem] p-7 sm:p-9">
            <h1 className="brand-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
              Your account is almost ready.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
              We signed you in, but this environment could not finish creating your creator profile automatically. Please try again shortly or contact us directly.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const demoReady = !accountNeedsDemo(viewer.account);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader viewer={viewer} />

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="surface-card rounded-[2rem] p-6 sm:p-8">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-dark)]">
              Your project profile
            </p>
            <h1 className="brand-display mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-[3rem]">
              Keep your creator details current.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
              This is the same core information from the landing form, now inside your account. Update it any time so your build context stays accurate.
            </p>
            <div className="mt-8">
              <AccountProfileForm account={viewer.account} />
            </div>
          </div>

          <div className="space-y-6">
            <section className="surface-card rounded-[2rem] p-6 sm:p-8">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-dark)]">
                Demo access
              </p>
              <h2 className="brand-display mt-4 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                Your shared app experience
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
                When a demo or working app link is ready, it will appear here with the right label and status.
              </p>

              {demoReady ? (
                <div className="mt-6 rounded-[1.6rem] border border-[rgba(91,77,255,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,236,0.94))] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[rgba(91,77,255,0.16)] bg-[rgba(91,77,255,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-dark)]">
                      {viewer.account.demo_status.replace("_", " ")}
                    </span>
                    {viewer.account.demo_label ? (
                      <span className="rounded-full border border-[rgba(23,20,17,0.08)] bg-white/82 px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                        {viewer.account.demo_label}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                    Open the latest shared build below.
                  </p>
                  <a
                    href={viewer.account.primary_demo_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(91,77,255,0.22)] hover:-translate-y-0.5 hover:bg-[var(--accent-dark)]"
                  >
                    Launch demo
                  </a>
                </div>
              ) : (
                <div className="mt-6 rounded-[1.6rem] border border-dashed border-[rgba(23,20,17,0.14)] bg-white/66 p-5">
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    No demo link has been assigned yet. Once we share a preview or working app, it will show up here automatically.
                  </p>
                </div>
              )}
            </section>

            <section className="surface-card rounded-[2rem] p-6 sm:p-8">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-dark)]">
                Account snapshot
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  ["Email", viewer.account.email],
                  ["Brand", viewer.account.brand_name || "Not set yet"],
                  ["Primary platform", viewer.account.primary_platform || "Not set yet"],
                  ["Audience size", viewer.account.audience_size_range || "Not set yet"]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-[rgba(23,20,17,0.08)] bg-white/74 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
