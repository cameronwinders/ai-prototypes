import { WishlistManager } from "@/components/WishlistManager";
import { getWishlistCoursesForUser } from "@/lib/data";
import { getSiteUrl } from "@/lib/supabase/env";
import { requireOnboardedViewer } from "@/lib/viewer";

export default async function WishlistPage() {
  const viewer = await requireOnboardedViewer("/me/wishlist");
  const wishlistCourses = await getWishlistCoursesForUser(viewer.user!.id);
  const siteUrl = getSiteUrl();
  const inviteUrl = `${siteUrl}/invite/${viewer.profile?.handle ?? "golfer"}`;

  return (
    <WishlistManager
      initialCourses={wishlistCourses}
      siteUrl={siteUrl}
      viewerHandle={viewer.profile?.handle ?? "golfer"}
      inviteUrl={inviteUrl}
    />
  );
}
