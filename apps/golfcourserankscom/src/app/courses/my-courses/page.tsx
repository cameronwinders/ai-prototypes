import { redirect } from "next/navigation";

import { getViewerContext } from "@/lib/viewer";

export default async function LegacyCoursesMyCoursesPage() {
  const viewer = await getViewerContext();

  if (!viewer.user) {
    redirect("/sign-in?next=%2Fme%2Fcourses");
  }

  if (viewer.profile?.onboarding_completed) {
    redirect("/me/courses");
  }

  redirect("/onboarding?next=%2Fme%2Fcourses");
}
