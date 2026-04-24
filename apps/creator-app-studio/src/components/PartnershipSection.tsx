import { partnershipPoints } from "@/lib/constants";

export function PartnershipSection() {
  return (
    <section id="partnership" className="section-anchor px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-card rounded-[2rem] p-7 sm:p-9">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-dark)]">
              Partnership model
            </p>
            <h2 className="brand-display mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-4xl lg:text-[3.1rem]">
              Built like a product. Structured like a partnership.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
              We work around a clear build fee plus aligned revenue share so the model
              stays serious, flexible, and tied to real audience fit.
            </p>
            <div className="mt-8 rounded-[1.6rem] border border-[rgba(91,77,255,0.18)] bg-[linear-gradient(140deg,rgba(91,77,255,0.12),rgba(255,253,248,0.94))] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-dark)]">
                Aligned upside
              </p>
              <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                We win when your product works.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {partnershipPoints.map((point) => (
              <article
                key={point}
                className="surface-card rounded-[1.65rem] p-6 hover:border-[rgba(91,77,255,0.22)]"
              >
                <div className="h-1.5 w-14 rounded-full bg-[rgba(91,77,255,0.8)]" />
                <p className="mt-4 text-base leading-7 text-[var(--text-primary)]">{point}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
