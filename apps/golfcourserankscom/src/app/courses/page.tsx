import { CoursesBrowser } from "@/components/CoursesBrowser";
import { getAllCourses, getPlayedCoursesForUser } from "@/lib/data";
import { getViewerContext } from "@/lib/viewer";

export default async function CoursesPage() {
  const viewer = await getViewerContext();
  const [courses, playedCourses] = await Promise.all([
    getAllCourses(),
    viewer.user ? getPlayedCoursesForUser(viewer.user.id) : Promise.resolve([])
  ]);

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Browse courses</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          The seeded shortlist of public rounds that count right now.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          The leaderboard universe is intentionally curated in Phase 1 so cold start still feels credible. Mark what you have played, then decide whether each course belongs in your personal stack.
        </p>
      </section>

      <section className="shell-panel rounded-[2rem] p-6">
        <CoursesBrowser
          courses={courses}
          initialPlayedCourses={playedCourses}
          viewerSignedIn={Boolean(viewer.user)}
          viewerNeedsOnboarding={Boolean(viewer.user && !viewer.profile?.onboarding_completed)}
        />
      </section>
    </div>
  );
}
