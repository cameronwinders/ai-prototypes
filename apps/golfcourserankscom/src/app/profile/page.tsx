import Link from "next/link";
import { redirect } from "next/navigation";

import { updateProfileSettingsAction } from "@/app/actions";
import { ShareButton } from "@/components/ShareButton";
import { getProfileSummary } from "@/lib/data";
import { getSiteUrl } from "@/lib/supabase/env";
import { PROFILE_VISIBILITY_OPTIONS } from "@/lib/types";
import { requireOnboardedViewer } from "@/lib/viewer";

const STATE_OPTIONS = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireOnboardedViewer("/profile");
  const summary = await getProfileSummary(viewer.user!.id);
  const siteUrl = getSiteUrl();
  const params = await searchParams;
  const savedParam = params.saved;
  const errorParam = params.error;
  const saved = Array.isArray(savedParam) ? savedParam[0] : savedParam;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  if (summary.playedCount === 0) {
    redirect("/onboarding?step=picker&next=/profile");
  }

  const publicProfileUrl = `${siteUrl}/u/${summary.profile?.handle ?? viewer.profile?.handle}`;

  return (
    <div className="space-y-6">
      <section className="shell-panel p-6 sm:p-8">
        <p className="eyebrow">ACCOUNT SETTINGS</p>
        <h1 className="h2 mt-4">{summary.profile?.display_name ?? summary.profile?.handle ?? "Your account"}</h1>
        <p className="subhed mt-4">
          Keep your public profile clean, decide what other golfers can see, and share one canonical URL.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ShareButton
            title="Share your Golf Course Ranks profile"
            text="See how I rank public golf courses on Golf Course Ranks."
            url={publicProfileUrl}
            className="ghost-button"
            analyticsSurface="account-profile"
            buttonChildren="Copy profile link"
          />
          <Link href={`/u/${summary.profile?.handle ?? viewer.profile?.handle}`} className="solid-button">
            View public profile
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Played courses", value: summary.playedCount },
            { label: "Ranked courses", value: summary.rankedCount },
            { label: "Accepted friends", value: summary.acceptedFriends },
            { label: "Incoming requests", value: summary.incomingRequests }
          ].map((item) => (
            <div key={item.label} className="shell-panel-contrast p-4">
              <p className="meta">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-[var(--tracking-tight)] text-[var(--ink)]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="shell-panel p-6">
          <p className="eyebrow">PROFILE CONTROLS</p>
          <h2 className="h3 mt-4">Choose how your profile shows up</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Your handle is generated automatically at signup. You can change it one time for free.
          </p>

          {saved ? <div className="mt-5 pill pill-pine pill-sentence">Settings saved.</div> : null}
          {error ? <div className="mt-5 pill pill-warning pill-sentence">{error}</div> : null}

          <form action={updateProfileSettingsAction} className="mt-6 grid gap-5">
            <input type="hidden" name="next" value="/profile" />
            <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
              Display name
              <input
                type="text"
                name="display_name"
                defaultValue={summary.profile?.display_name ?? ""}
                className="min-h-11 rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[rgba(49,107,83,0.45)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
              Handle
              <input
                type="text"
                name="handle"
                defaultValue={summary.profile?.handle ?? ""}
                className="min-h-11 rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[rgba(49,107,83,0.45)]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Home state
                <select
                  name="home_state"
                  defaultValue={summary.profile?.home_state ?? ""}
                  className="min-h-11 rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[rgba(49,107,83,0.45)]"
                >
                  <option value="">Prefer not to show</option>
                  {STATE_OPTIONS.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Profile visibility
                <select
                  name="profile_visibility"
                  defaultValue={summary.profile?.profile_visibility ?? "public"}
                  className="min-h-11 rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[rgba(49,107,83,0.45)]"
                >
                  {PROFILE_VISIBILITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "friends_only" ? "Friends only" : option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3">
              <label className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm">
                <span className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="handicap_visibility"
                    defaultChecked={summary.profile?.handicap_visibility ?? true}
                    className="mt-1 h-4 w-4 accent-[var(--pine)]"
                  />
                  <span>
                    <span className="block font-semibold text-[var(--ink)]">Show handicap band on my public profile</span>
                    <span className="mt-1 block text-[var(--muted)]">
                      Turn this off if you want rankings public without the handicap context.
                    </span>
                  </span>
                </span>
              </label>

              <label className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm">
                <span className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="discoverability_enabled"
                    defaultChecked={summary.profile?.discoverability_enabled ?? true}
                    className="mt-1 h-4 w-4 accent-[var(--pine)]"
                  />
                  <span>
                    <span className="block font-semibold text-[var(--ink)]">Let other golfers find me in search</span>
                    <span className="mt-1 block text-[var(--muted)]">This controls invite search and friend discovery.</span>
                  </span>
                </span>
              </label>
            </div>

            <button type="submit" className="solid-button w-fit">
              Save profile settings
            </button>
          </form>
        </section>

        <aside className="shell-panel-soft p-6">
          <p className="eyebrow">SHARE PREVIEW</p>
          <h2 className="h3 mt-4">Your public URL is ready</h2>
          <div className="shell-panel-contrast mt-5 p-4">
            <p className="meta">Profile link</p>
            <p className="mt-2 break-all text-sm font-semibold text-[var(--ink)]">{publicProfileUrl}</p>
          </div>
          <div className="mt-5 grid gap-3">
            <Link href="/friends" className="ghost-button justify-center">
              Open friends
            </Link>
            <Link href="/me/courses" className="ghost-button justify-center">
              Keep ranking
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
