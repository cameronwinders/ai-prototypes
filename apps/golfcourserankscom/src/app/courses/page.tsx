import { CoursesBrowser } from "@/components/CoursesBrowser";
import { getLeaderboardCourses, getPlayedCoursesForUser, getWishlistCourseIdsForUser } from "@/lib/data";
import { getViewerContext } from "@/lib/viewer";

export default async function CoursesPage() {
  const viewer = await getViewerContext();
  const [courses, playedCourses, wishlistIds] = await Promise.all([
    // Enriched leaderboard data (editorial avg, vs-editorial, signals, friends-played)
    // so Browse can render the full Web UI Kit CourseRow. minSignals:0 keeps the
    // entire course directory, not just ranked courses.
    getLeaderboardCourses({ minSignals: 0, limit: 1000, viewerId: viewer.user?.id ?? null }),
    viewer.user ? getPlayedCoursesForUser(viewer.user.id) : Promise.resolve([]),
    viewer.user ? getWishlistCourseIdsForUser(viewer.user.id) : Promise.resolve(new Set<string>())
  ]);

  return (
    <section className="shell-panel shell-panel-soft p-6">
      <CoursesBrowser
        courses={courses}
        initialPlayedCourses={playedCourses}
        initialWishlistIds={Array.from(wishlistIds)}
        viewerSignedIn={Boolean(viewer.user)}
        viewerNeedsOnboarding={Boolean(viewer.user && !viewer.profile?.onboarding_completed)}
      />
    </section>
  );
}
