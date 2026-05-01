import { redirect } from "next/navigation";

import { MyCoursesManager } from "@/components/MyCoursesManager";
import { getAllCourses, getPlayedCoursesForUser } from "@/lib/data";
import { getSiteUrl } from "@/lib/supabase/env";
import { requireOnboardedViewer } from "@/lib/viewer";

export default async function MyCoursesPage() {
  const viewer = await requireOnboardedViewer("/me/courses");
  const [playedCourses, allCourses] = await Promise.all([getPlayedCoursesForUser(viewer.user!.id), getAllCourses()]);
  const siteUrl = getSiteUrl();

  if (playedCourses.length === 0) {
    redirect("/onboarding?step=picker&next=/me/courses");
  }

  return (
    <MyCoursesManager
      initialPlayedCourses={playedCourses}
      allCourses={allCourses}
      siteUrl={siteUrl}
      viewerHandle={viewer.profile?.handle ?? "golfer"}
    />
  );
}
