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
    <div className="shell-panel shell-panel-soft relative min-h-[20rem] p-5 sm:p-6">
      <div className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <p className="meta mt-1">{caption}</p>
          </div>
          <span className="pill pill-line text-pine">{badgeLabel}</span>
        </div>

        <div className="rounded-lg border border-line bg-white p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="pill pill-pine">#{hero.leaderboardRank}</span>
                <span className="pill pill-line">{heroTagLabel}</span>
              </div>
              <h2 className="mt-3 text-[1.65rem] font-semibold tracking-[var(--tracking-tight)] text-ink">
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

            <div className="w-full rounded-md border border-[rgba(49,107,83,0.12)] bg-pine-soft px-3 py-2 text-left sm:w-auto sm:text-right">
              <p className="section-label text-[10px]">{scoreEyebrow}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-[var(--tracking-tight)] text-ink">
                {hero.normalizedScore.toFixed(1)}
              </p>
            </div>
          </div>

          {showRest ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {rest.slice(0, 2).map((course) => (
                <div
                  key={course.id}
                  className="rounded-md border border-line bg-linen-warm px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="pill pill-line bg-linen">#{course.leaderboardRank}</span>
                    <span className="section-label text-[11px] text-pine">{course.normalizedScore.toFixed(1)}</span>
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
