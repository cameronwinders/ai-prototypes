import { SignInForm } from "@/components/SignInForm";
import { getProfileByHandle } from "@/lib/data";

function getInviteHandle(next: string | null | undefined) {
  if (!next) {
    return null;
  }

  const normalized = decodeURIComponent(next);
  const match = normalized.match(/\/invite\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextParam = params.next;
  const next = Array.isArray(nextParam) ? nextParam[0] : nextParam;
  const inviteHandle = getInviteHandle(next);
  const inviter = inviteHandle ? await getProfileByHandle(inviteHandle) : null;
  const eyebrow = inviter ? "FRIEND INVITE" : "SIGN IN";
  const title = inviter
    ? `Continue to compare with ${inviter.display_name ?? inviter.handle}`
    : "Sign in to rank public U.S. golf courses";
  const subhed = inviter
    ? `${inviter.display_name ?? inviter.handle} invited you to compare public-course lists. Create your account or sign in, rank the courses you have played, and we will bring you back ready to compare.`
    : "Track the public courses you have played, build a wish list, and compare the crowd board with Golf Digest, GOLF.com, and Golfweek.";
  const helper = inviter
    ? "No password required. Open the email link to create your account or sign in, then finish your ranking before you compare."
    : "No password required. Open the email link and you will come right back ready to start ranking.";

  return (
    <div className="mx-auto w-full max-w-3xl overflow-x-hidden">
      <section className="shell-panel-contrast min-w-0 p-6 sm:p-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="h2">{title}</h1>
        <p className="subhed mt-4 max-w-2xl">{subhed}</p>
        <p className="mt-5 text-sm leading-7 text-[var(--muted)]">{helper}</p>
        <div className="mt-6">
          <SignInForm inviterName={inviter?.display_name ?? inviter?.handle ?? null} />
        </div>
      </section>
    </div>
  );
}
