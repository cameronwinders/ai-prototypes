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

  return (
    <div className="grid min-w-0 gap-6 overflow-x-hidden xl:grid-cols-[0.92fr_1.08fr]">
      <section className="shell-panel min-w-0 p-6 sm:p-8">
        <p className="eyebrow">{inviter ? "FRIEND INVITE" : "SIGN IN"}</p>
        <h1 className="h2 mt-4">
          {inviter ? `Continue to compare with ${inviter.display_name ?? inviter.handle}` : "The ranking list only real golfers can build"}
        </h1>
        <p className="subhed mt-4">
          {inviter
            ? `${inviter.display_name ?? inviter.handle} invited you to compare public-course lists. Sign in or create your account, set your handicap band, and rank the public U.S. golf courses you know best.`
            : "Sign in with your email to track the public U.S. golf courses you have played, build a wish list, and start ranking them."}
        </p>
        <div className="mt-8 grid gap-3">
          {(inviter
            ? [
                `${inviter.display_name ?? inviter.handle} already shared their list with you. Finish sign-in to unlock the overlap-only compare view.`,
                "During onboarding, pick and rank the public courses you have played so your first comparison has real signal.",
                "Once you finish, you will land back on the invite flow already connected."
              ]
            : [
                "The national leaderboard is built from real golfer comparisons, not star ratings.",
                "Mark played courses, rank them in order, and compare with friends you trust.",
                "Feedback and course requests are always one tap away."
              ]).map((item) => (
            <div key={item} className="rounded-[var(--radius-md)] border border-[rgba(24,37,43,0.08)] bg-white/85 px-4 py-3 text-sm leading-7 text-[var(--muted)]">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="shell-panel-contrast min-w-0 p-6 sm:p-8">
        <p className="eyebrow">ONE-TAP EMAIL SIGN-IN</p>
        <h2 className="h3 mt-4">Email yourself the secure link</h2>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          {inviter
            ? `No password required. Open the link from your inbox and we will bring you right back to ${inviter.display_name ?? inviter.handle}'s invite.`
            : "No password required. Open the link from your inbox and we will bring you right back to the page you started from."}
        </p>
        <div className="mt-8">
          <SignInForm inviterName={inviter?.display_name ?? inviter?.handle ?? null} />
        </div>
      </section>
    </div>
  );
}
