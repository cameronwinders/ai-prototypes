import { FeedbackForm } from "@/components/FeedbackForm";

export default async function FeedbackPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const screenParam = params.screen;
  const fromParam = params.from;
  const screenName = Array.isArray(screenParam) ? screenParam[0] : screenParam ?? "App";
  const currentUrl = Array.isArray(fromParam) ? fromParam[0] : fromParam ?? "/feedback";

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Feedback</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Help sharpen the next release.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          Bugs, feature requests, and rough edges all land here with the current screen and URL already attached.
        </p>
      </section>

      <section className="glass-panel rounded-[2rem] p-6 sm:p-7">
        <FeedbackForm initialScreenName={screenName} initialUrl={currentUrl} />
      </section>
    </div>
  );
}
