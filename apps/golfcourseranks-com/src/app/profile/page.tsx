import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/viewer";

export default async function SelfProfileRedirectPage() {
  const viewer = await requireViewer("/profile");

  if (!viewer.profile?.handle) {
    redirect("/onboarding");
  }

  redirect(`/profile/${viewer.profile.handle}`);
}
