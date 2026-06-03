import { getAdminFeedbackEntries } from "@/lib/data";
import { requireAdminViewer } from "@/lib/viewer";

const FEEDBACK_LABELS: Record<string, string> = {
  bug: "Bug",
  feature: "Feature request",
  general: "General feedback",
  "course-addition": "Course addition"
};

export default async function AdminFeedbackPage() {
  await requireAdminViewer("/admin/feedback");
  const feedback = await getAdminFeedbackEntries(100);

  return (
    <div className="space-y-6">
      <section className="shell-panel p-6 sm:p-8">
        <p className="eyebrow">ADMIN FEEDBACK</p>
        <h1 className="h2">Every bug, feature request, and rough edge in one place</h1>
        <p className="subhed mt-4">
          Each submission carries the screen and URL so product triage does not depend on guesswork.
        </p>
      </section>

      <section className="shell-panel-contrast p-6">
        <div className="grid gap-3">
          {feedback.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-7 text-[var(--muted)]">
              No feedback submissions yet.
            </div>
          ) : (
            feedback.map((item) => (
              <div key={item.id} className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/92 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill pill-pine">
                    {FEEDBACK_LABELS[item.feedback_type] ?? item.feedback_type}
                  </span>
                  <span className="pill pill-line">
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
