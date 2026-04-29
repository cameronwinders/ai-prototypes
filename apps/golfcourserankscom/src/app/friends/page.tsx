import { FriendsManager } from "@/components/FriendsManager";
import { getFriendsPageData } from "@/lib/data";
import { requireOnboardedViewer } from "@/lib/viewer";

export default async function FriendsPage() {
  const viewer = await requireOnboardedViewer("/friends");
  const friends = await getFriendsPageData(viewer.user!.id);

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Friends</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Follow golf friends and compare your lists.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          Keep the social side simple: connect by email, accept on the other side, and unlock clean side-by-side comparisons built from the courses you both know.
        </p>
      </section>

      <FriendsManager initialData={friends} />
    </div>
  );
}
