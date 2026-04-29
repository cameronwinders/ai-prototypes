import { getAdminFeedbackEntries } from "@/lib/data";
import { requireAdminViewer } from "@/lib/viewer";

export default async function AdminFeedbackPage() {
  await requireAdminViewer("/admin/feedback");
  const feedback = await getAdminFeedbackEntries(100);

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Admin feedback</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Every bug, feature request, and rough edge in one place.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          This viewer is allowlist-protected. Each submission carries the screen and URL so product triage does not depend on guesswork.
        </p>
      </section>

      <section className="shell-panel rounded-[2rem] p-6">
        <div className="grid gap-3">
          {feedback.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-[var(--line)] px-5 py-8 text-sm text-[var(--muted)]">
              No feedback submissions yet.
            </div>
          ) : (
            feedback.map((item) => (
              <div key={item.id} className="rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">
                    {item.feedback_type}
                  </span>
                  <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {item.screen_name}
                  </span>
                </div>
                <p className="mt-4 text-base leading-7 text-[var(--ink)]">{item.message}</p>
                <div className="mt-4 text-sm text-[var(--muted)]">
                  <p>URL: {item.current_url}</p>
                  <p>User: {item.viewer_email ?? "Anonymous"}</p>
                  <p>Submitted: {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
