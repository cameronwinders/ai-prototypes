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
    <section className="shell-panel shell-panel-soft rounded-[2rem] p-6">
      <CoursesBrowser
        courses={courses}
        initialPlayedCourses={playedCourses}
        viewerSignedIn={Boolean(viewer.user)}
        viewerNeedsOnboarding={Boolean(viewer.user && !viewer.profile?.onboarding_completed)}
      />
    </section>
  );
}
