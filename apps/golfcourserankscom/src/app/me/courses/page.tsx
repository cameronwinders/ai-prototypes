import { MyCoursesManager } from "@/components/MyCoursesManager";
import { ShareButton } from "@/components/ShareButton";
import { getPlayedCoursesForUser } from "@/lib/data";
import { getSiteUrl } from "@/lib/supabase/env";
import { requireOnboardedViewer } from "@/lib/viewer";

export default async function MyCoursesPage() {
  const viewer = await requireOnboardedViewer("/me/courses");
  const playedCourses = await getPlayedCoursesForUser(viewer.user!.id);
  const siteUrl = getSiteUrl();

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.2rem] p-6 sm:p-8">
        <p className="section-label">My courses</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Your public-course stack.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          Keep the list honest. Played courses can live unranked until you are ready, and every saved reorder helps shape the national leaderboard.
        </p>
        <div className="mt-6">
          <ShareButton
            title="Share your ranking list"
            text="See how I rank public golf courses on Golf Course Ranks."
            url={`${siteUrl}/me/courses`}
            className="ghost-button min-h-11"
          />
        </div>
      </section>

      <MyCoursesManager initialPlayedCourses={playedCourses} />
    </div>
  );
}
