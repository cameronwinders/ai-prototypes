import { MyCoursesManager } from "@/components/MyCoursesManager";
import { getAllCourses, getRankedCoursesForUser } from "@/lib/data";
import { requireOnboardedViewer } from "@/lib/viewer";

export default async function MyCoursesPage() {
  const viewer = await requireOnboardedViewer("/my-courses");
  const [allCourses, rankings] = await Promise.all([
    getAllCourses(),
    getRankedCoursesForUser(viewer.user!.id)
  ]);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[2.2rem] p-6 sm:p-8">
        <p className="section-label">My courses</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Your personal public-course stack.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          Every reorder updates your `rank_index`, rebuilds pairwise signals, and feeds the national leaderboard. Top equals favorite.
        </p>
      </section>

      <MyCoursesManager allCourses={allCourses} initialRankings={rankings} />
    </div>
  );
}
