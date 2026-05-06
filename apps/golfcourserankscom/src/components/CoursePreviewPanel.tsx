import { EDITORIAL_LISTS, type EditorialKey } from "@/lib/types";

type PreviewCourse = {
  id: string;
  name: string;
  city: string;
  state: string;
  leaderboardRank: number;
  normalizedScore: number;
  editorialRanks?: Partial<Record<EditorialKey, number>>;
};

type CoursePreviewPanelProps = {
  courses: PreviewCourse[];
  eyebrow?: string;
  caption?: string;
  badgeLabel?: string;
  heroTagLabel?: string;
  scoreEyebrow?: string;
  showRest?: boolean;
};

function formatEditorialPosition(position?: number) {
  return position ? `#${position}` : "\u2014";
}

export function CoursePreviewPanel({
  courses,
  eyebrow = "Right now on the board",
  caption = "A snapshot of the courses golfers keep closest to the top.",
  badgeLabel = "Top 3",
  heroTagLabel = "Crowd favorite",
  scoreEyebrow = "Crowd score",
  showRest = true
}: CoursePreviewPanelProps) {
  const [hero, ...rest] = courses;

  if (!hero) {
    return null;
  }

  return (
    <div className="relative min-h-[20rem] overflow-hidden rounded-xl border border-line bg-[linear-gradient(180deg,_rgba(230,241,234,0.98)_0%,_rgba(247,244,238,0.96)_56%,_rgba(231,221,194,0.86)_100%)] p-5 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-[42%] bg-[radial-gradient(circle_at_18%_20%,_rgba(255,255,255,0.82),_transparent_30%),linear-gradient(180deg,_rgba(213,232,221,0.92)_0%,_rgba(237,244,239,0.36)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-[linear-gradient(180deg,_rgba(231,221,194,0.14)_0%,_rgba(223,210,179,0.58)_100%)]" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <p className="meta mt-1">{caption}</p>
          </div>
          <span className="pill pill-line border-white/70 bg-white/72 text-pine shadow-chip">{badgeLabel}</span>
        </div>

        <div className="rounded-lg border border-white/70 bg-white/78 p-4 shadow-[0_24px_60px_rgba(24,39,31,0.12)] backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="pill pill-pine">#{hero.leaderboardRank}</span>
                <span className="pill pill-line">{heroTagLabel}</span>
              </div>
              <h2 className="mt-3 font-display text-[1.65rem] font-semibold tracking-[var(--tracking-tight)] text-ink">
                {hero.name}
              </h2>
              <p className="meta mt-1">
                {hero.city}, {hero.state}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {EDITORIAL_LISTS.map((editorial) => (
                  <span key={editorial.key} className="pill pill-line">
                    {editorial.label} {formatEditorialPosition(hero.editorialRanks?.[editorial.key])}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-[rgba(49,107,83,0.12)] bg-[rgba(216,231,221,0.76)] px-3 py-2 text-right">
              <p className="eyebrow text-[10px]">{scoreEyebrow}</p>
              <p className="mt-1 text-2xl font-semibold tracking-[var(--tracking-tight)] text-ink">
                {hero.normalizedScore.toFixed(1)}
              </p>
            </div>
          </div>

          {showRest ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {rest.slice(0, 2).map((course) => (
                <div
                  key={course.id}
                  className="rounded-md border border-[rgba(28,41,36,0.08)] bg-white/82 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="pill pill-line bg-linen">#{course.leaderboardRank}</span>
                    <span className="eyebrow text-[11px] text-pine">{course.normalizedScore.toFixed(1)}</span>
                  </div>
                  <p className="mt-3 text-base font-semibold tracking-[-0.03em] text-ink">{course.name}</p>
                  <p className="meta mt-1">
                    {course.city}, {course.state}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
