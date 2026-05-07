import { CoursesBrowser } from "@/components/CoursesBrowser";
import { getAllCourses, getPlayedCoursesForUser, getWishlistCourseIdsForUser } from "@/lib/data";
import { getViewerContext } from "@/lib/viewer";

export default async function CoursesPage() {
  const viewer = await getViewerContext();
  const [courses, playedCourses, wishlistIds] = await Promise.all([
    getAllCourses(),
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
