import { SectionIntro } from "@/components/SectionIntro";
import { qualitySignals } from "@/lib/constants";

export function QualitySection() {
  return (
    <section className="section-anchor px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="surface-card overflow-hidden rounded-[2rem] p-7 sm:p-9 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <SectionIntro
              eyebrow="Why creators trust this model"
              title="Premium enough for your audience. Simple enough to actually operate."
              body="Creator trust is fragile. The design, product structure, and launch mechanics all need to feel considered."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {qualitySignals.map((signal) => (
                <article
                  key={signal.title}
                  className="rounded-[1.5rem] border border-[rgba(23,20,17,0.08)] bg-white/76 p-5"
                >
                  <h3 className="brand-display text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                    {signal.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
                    {signal.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
