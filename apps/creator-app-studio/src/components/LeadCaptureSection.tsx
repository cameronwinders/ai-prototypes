import { LeadForm } from "@/components/LeadForm";

export function LeadCaptureSection() {
  return (
    <section id="contact" className="section-anchor px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="surface-card overflow-hidden rounded-[2rem] p-7 sm:p-9 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="max-w-xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-dark)]">
                Submit your idea
              </p>
              <h2 className="brand-display mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-4xl lg:text-[3.2rem]">
                Tell us what your audience already wants more of.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)]">
                Share the rough shape of your brand, audience, and app concept. A short note is
                enough. We’ll review fit, think through the product angle, and come back with a
                clear next step.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Short form. No booking embed required.",
                  "Designed for creators who care about brand quality and audience trust.",
                  "A good fit if you already have demand around a method, routine, or community."
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.15rem] border border-[rgba(23,20,17,0.08)] bg-white/76 px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.85rem] border border-[rgba(91,77,255,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,236,0.94))] p-5 shadow-[0_28px_60px_rgba(23,20,17,0.1)] sm:p-6">
              <LeadForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
