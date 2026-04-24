type SectionIntroProps = {
  eyebrow: string;
  title: string;
  body: string;
  align?: "left" | "center";
};

export function SectionIntro({
  eyebrow,
  title,
  body,
  align = "left"
}: SectionIntroProps) {
  const alignment = align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl";

  return (
    <div className={alignment}>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-dark)]">
        {eyebrow}
      </p>
      <h2 className="brand-display mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl lg:text-[3.25rem]">
        {title}
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
        {body}
      </p>
    </div>
  );
}
