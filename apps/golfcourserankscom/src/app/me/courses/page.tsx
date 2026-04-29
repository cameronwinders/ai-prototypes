import { MyCoursesManager } from "@/components/MyCoursesManager";
import { getPlayedCoursesForUser } from "@/lib/data";
import { requireOnboardedViewer } from "@/lib/viewer";

export default async function MyCoursesPage() {
  const viewer = await requireOnboardedViewer("/me/courses");
  const playedCourses = await getPlayedCoursesForUser(viewer.user!.id);

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.2rem] p-6 sm:p-8">
        <p className="section-label">My courses</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Your public-course stack.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          Keep the list honest. Played courses can live unranked until you are ready, and every saved reorder updates the national leaderboard signals.
        </p>
      </section>

      <MyCoursesManager initialPlayedCourses={playedCourses} />
    </div>
  );
}
