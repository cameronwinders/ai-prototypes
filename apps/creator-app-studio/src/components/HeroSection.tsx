import { heroSignals } from "@/lib/constants";

export function HeroSection() {
  return (
    <section id="top" className="section-anchor px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="surface-card editorial-grid overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10 xl:p-12">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_29rem]">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-dark)]">
                Premium digital products for creators
              </p>
              <h1 className="brand-display mt-5 max-w-3xl text-5xl font-semibold leading-[0.92] tracking-[-0.065em] text-[var(--text-primary)] sm:text-6xl xl:text-[5.4rem]">
                Launch a premium app your audience will pay for.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">
                We help creators turn their frameworks, routines, and communities into
                branded web app experiences built beautifully, launched quickly, and
                structured to grow with their audience.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(91,77,255,0.22)] hover:-translate-y-0.5 hover:bg-[var(--accent-dark)]"
                >
                  Submit your idea
                </a>
                <a
                  href="#examples"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-white/80 px-6 py-3.5 text-sm font-semibold text-[var(--text-primary)] hover:-translate-y-0.5 hover:border-[rgba(91,77,255,0.34)] hover:bg-white"
                >
                  Explore examples
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {heroSignals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-[rgba(23,20,17,0.08)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>

            <div
              aria-hidden="true"
              className="relative min-h-[27rem] overflow-hidden rounded-[2rem] border border-[rgba(23,20,17,0.08)] bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(245,239,231,0.96))] p-5 shadow-[0_34px_80px_rgba(23,20,17,0.12)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(91,77,255,0.16),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(46,36,110,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.45),transparent)]" />
              <div className="relative flex h-full flex-col justify-between rounded-[1.6rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,250,244,0.82))] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-dark)]">
                      Creator App Studio
                    </p>
                    <p className="brand-display mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                      Product canvas
                    </p>
                  </div>
                  <div className="rounded-full border border-[rgba(91,77,255,0.16)] bg-[rgba(91,77,255,0.1)] px-3 py-1 text-xs font-medium text-[var(--accent-dark)]">
                    Brand-safe
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="drift-slow rounded-[1.4rem] border border-[rgba(91,77,255,0.18)] bg-[linear-gradient(180deg,rgba(91,77,255,0.14),rgba(255,255,255,0.92))] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-dark)]">
                      Challenge app
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                      Guided milestones, streak logic, and premium momentum that fits a
                      creator launch.
                    </p>
                  </div>
                  <div className="drift-delayed rounded-[1.4rem] border border-[rgba(23,20,17,0.08)] bg-white/88 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      Member dashboard
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="h-2.5 w-3/4 rounded-full bg-[rgba(23,20,17,0.08)]" />
                      <div className="h-2.5 w-full rounded-full bg-[rgba(91,77,255,0.18)]" />
                      <div className="h-2.5 w-2/3 rounded-full bg-[rgba(23,20,17,0.08)]" />
                    </div>
                  </div>
                  <div className="drift-medium rounded-[1.4rem] border border-[rgba(23,20,17,0.08)] bg-white/88 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      Personalized plan
                    </p>
                    <div className="mt-4 flex items-end gap-2">
                      <div className="h-8 w-8 rounded-2xl bg-[rgba(91,77,255,0.16)]" />
                      <div className="h-12 w-16 rounded-[1rem] bg-[rgba(91,77,255,0.28)]" />
                      <div className="h-16 w-20 rounded-[1rem] bg-[rgba(46,36,110,0.18)]" />
                    </div>
                  </div>
                  <div className="drift-slow rounded-[1.4rem] border border-[rgba(23,20,17,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,243,236,0.94))] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      Community prompts
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Daily reflection", "Check-in", "Prompt drop"].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[rgba(23,20,17,0.08)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[rgba(23,20,17,0.08)] bg-white/84 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Built like a product
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                        Structured around launch readiness, audience trust, and monetization
                        from day one.
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-[rgba(91,77,255,0.12)] px-3 py-2 text-right">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent-dark)]">
                        Model
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                        Build fee + share
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
