import { WishlistManager } from "@/components/WishlistManager";
import { getWishlistCoursesForUser } from "@/lib/data";
import { requireOnboardedViewer } from "@/lib/viewer";

export default async function WishlistPage() {
  const viewer = await requireOnboardedViewer("/me/wishlist");
  const wishlistCourses = await getWishlistCoursesForUser(viewer.user!.id);

  return <WishlistManager initialCourses={wishlistCourses} />;
}
