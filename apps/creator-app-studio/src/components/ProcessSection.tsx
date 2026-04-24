import { SectionIntro } from "@/components/SectionIntro";
import { processSteps } from "@/lib/constants";

export function ProcessSection() {
  return (
    <section id="process" className="section-anchor px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="How it works"
          title="A calm, competent process that makes product feel accessible."
          body="The goal is to make creators feel taken care of, not pushed into a complicated build cycle. We keep the process structured, collaborative, and practical from concept to launch."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {processSteps.map((step) => (
            <article
              key={step.step}
              className="surface-card rounded-[1.75rem] p-6 sm:p-7"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-dark)]">
                {step.step}
              </p>
              <h3 className="brand-display mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                {step.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
