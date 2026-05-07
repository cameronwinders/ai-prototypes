import { redirect } from "next/navigation";

import { MyCoursesManager } from "@/components/MyCoursesManager";
import { getAllCourses, getPlayedCoursesForUser, getWishlistCourseIdsForUser } from "@/lib/data";
import { getSiteUrl } from "@/lib/supabase/env";
import { requireOnboardedViewer } from "@/lib/viewer";

export default async function MyCoursesPage() {
  const viewer = await requireOnboardedViewer("/me/courses");
  const [playedCourses, allCourses, wishlistIds] = await Promise.all([
    getPlayedCoursesForUser(viewer.user!.id),
    getAllCourses(),
    getWishlistCourseIdsForUser(viewer.user!.id)
  ]);
  const siteUrl = getSiteUrl();

  if (playedCourses.length === 0) {
    redirect("/onboarding?step=picker&next=/me/courses");
  }

  return (
    <MyCoursesManager
      initialPlayedCourses={playedCourses}
      initialWishlistIds={Array.from(wishlistIds)}
      allCourses={allCourses}
      siteUrl={siteUrl}
      viewerHandle={viewer.profile?.handle ?? "golfer"}
    />
  );
}
