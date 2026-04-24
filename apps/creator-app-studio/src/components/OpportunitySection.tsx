import { opportunityPoints } from "@/lib/constants";

export function OpportunitySection() {
  return (
    <section className="section-anchor px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="max-w-xl">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-dark)]">
            The opportunity
          </p>
          <h2 className="brand-display mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-4xl lg:text-[3.15rem]">
            Your audience already trusts your taste. Give them something more useful than
            another download.
          </h2>
        </div>

        <div className="grid gap-4">
          {opportunityPoints.map((point, index) => (
            <div
              key={point}
              className="surface-card rounded-[1.75rem] p-6 sm:p-7"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(91,77,255,0.1)] text-sm font-semibold text-[var(--accent-dark)]">
                  0{index + 1}
                </div>
                <p className="text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                  {point}
                </p>
              </div>
            </div>
          ))}

          <div className="rounded-[1.75rem] border border-[rgba(91,77,255,0.16)] bg-[linear-gradient(140deg,rgba(91,77,255,0.12),rgba(255,253,248,0.94))] p-6 shadow-[0_18px_40px_rgba(91,77,255,0.08)] sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-dark)]">
              The missing layer
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-primary)]">
              Creators already know how to earn trust. The product layer is what turns that
              trust into a paid experience with depth, repeat use, and room to grow.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
