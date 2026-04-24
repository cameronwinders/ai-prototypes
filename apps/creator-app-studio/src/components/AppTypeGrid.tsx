import { SectionIntro } from "@/components/SectionIntro";
import { appTypes } from "@/lib/constants";

export function AppTypeGrid() {
  return (
    <section id="what-we-build" className="section-anchor px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="What we build"
          title="A creator's next revenue stream does not need to look like another course page."
          body="We build premium web experiences around a creator's existing frameworks, communities, and expertise."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {appTypes.map((item) => (
            <article
              key={item.title}
              className="group surface-card rounded-[1.65rem] p-6 hover:-translate-y-1 hover:border-[rgba(91,77,255,0.22)] hover:shadow-[0_22px_50px_rgba(23,20,17,0.11)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] border border-[rgba(91,77,255,0.16)] bg-[rgba(91,77,255,0.08)] text-sm font-semibold text-[var(--accent-dark)]">
                {item.title
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </div>
              <h3 className="brand-display mt-5 text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
