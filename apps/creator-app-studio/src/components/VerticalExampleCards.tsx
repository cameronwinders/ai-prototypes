import { SectionIntro } from "@/components/SectionIntro";
import { exampleConcepts } from "@/lib/constants";

export function VerticalExampleCards() {
  return (
    <section id="examples" className="section-anchor px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Examples"
          title="Different creator niches. Same premium product logic."
          body="Each concept starts with a creator's proven method and becomes a paid experience people can use repeatedly."
        />

        <div className="mt-12 grid gap-5 xl:grid-cols-2">
          {exampleConcepts.map((concept) => (
            <article
              key={concept.vertical}
              className="group surface-card overflow-hidden rounded-[1.9rem] p-6 sm:p-7"
            >
              <div
                className={`rounded-[1.6rem] border p-6 ring-1 ${concept.accentClasses} transition-transform duration-200 group-hover:-translate-y-1`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] opacity-80">
                      {concept.vertical}
                    </p>
                    <h3 className="brand-display mt-3 max-w-[18ch] text-[1.9rem] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[2.15rem]">
                      {concept.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-4 max-w-xl text-base leading-7 opacity-85">
                  {concept.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  {concept.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-current/10 bg-white/72 px-3.5 py-2 text-sm font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <p className="mt-5 text-sm leading-6 opacity-80">{concept.monetizationAngle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
