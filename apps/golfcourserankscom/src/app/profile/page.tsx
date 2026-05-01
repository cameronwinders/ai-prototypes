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
      <section className="shell-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Account settings</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          {summary.profile?.display_name ?? summary.profile?.handle ?? "Your account"}
        </h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          Keep your public profile clean, decide what other golfers can see, and share your top courses from one canonical URL.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ShareButton
            title="Share your Golf Course Ranks profile"
            text="See how I rank public golf courses on Golf Course Ranks."
            url={publicProfileUrl}
            className="ghost-button min-h-11"
            analyticsSurface="account-profile"
          />
          <Link href={`/u/${summary.profile?.handle ?? viewer.profile?.handle}`} className="solid-button min-h-11">
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
            <div key={item.label} className="rounded-[1.7rem] border border-[var(--line)] bg-white/88 p-4">
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="shell-panel rounded-[2rem] p-6">
          <p className="section-label">Profile controls</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Choose how your profile shows up.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Your handle is generated automatically at signup. You can change it one time for free.
          </p>

          {saved ? (
            <div className="mt-5 rounded-[1.4rem] border border-[rgba(49,107,83,0.18)] bg-[var(--pine-soft)] px-4 py-3 text-sm text-[var(--pine)]">
              Settings saved.
            </div>
          ) : null}
          {error ? (
            <div className="mt-5 rounded-[1.4rem] border border-[rgba(126,58,58,0.14)] bg-[rgba(126,58,58,0.08)] px-4 py-3 text-sm text-[var(--ink)]">
              {error}
            </div>
          ) : null}

          <form action={updateProfileSettingsAction} className="mt-6 grid gap-5">
            <input type="hidden" name="next" value="/profile" />
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Display name
              <input
                type="text"
                name="display_name"
                defaultValue={summary.profile?.display_name ?? ""}
                className="min-h-11 rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[rgba(49,107,83,0.45)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Handle
              <input
                type="text"
                name="handle"
                defaultValue={summary.profile?.handle ?? ""}
                className="min-h-11 rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[rgba(49,107,83,0.45)]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
                Home state
                <select
                  name="home_state"
                  defaultValue={summary.profile?.home_state ?? ""}
                  className="min-h-11 rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[rgba(49,107,83,0.45)]"
                >
                  <option value="">Prefer not to show</option>
                  {STATE_OPTIONS.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
                Profile visibility
                <select
                  name="profile_visibility"
                  defaultValue={summary.profile?.profile_visibility ?? "public"}
                  className="min-h-11 rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[rgba(49,107,83,0.45)]"
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
              <label className="flex items-start gap-3 rounded-[1.3rem] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm">
                <input
                  type="checkbox"
                  name="handicap_visibility"
                  defaultChecked={summary.profile?.handicap_visibility ?? true}
                  className="mt-1 h-4 w-4 accent-[var(--pine)]"
                />
                <span>
                  <span className="block font-semibold text-[var(--ink)]">Show handicap band on my public profile</span>
                  <span className="mt-1 block text-[var(--muted)]">Turn this off if you want rankings public without the handicap context.</span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-[1.3rem] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm">
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
              </label>
            </div>

            <button type="submit" className="solid-button min-h-11 w-fit">
              Save profile settings
            </button>
          </form>
        </section>

        <aside className="shell-panel rounded-[2rem] p-6">
          <p className="section-label">Share preview</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Your public URL is ready.
          </h2>
          <div className="mt-5 rounded-[1.5rem] border border-[var(--line)] bg-white/88 p-4">
            <p className="text-sm text-[var(--muted)]">Profile link</p>
            <p className="mt-2 break-all text-sm font-semibold text-[var(--ink)]">{publicProfileUrl}</p>
          </div>
          <div className="mt-5 grid gap-3">
            <Link href="/friends" className="ghost-button min-h-11 justify-center">
              Open friends
            </Link>
            <Link href="/me/courses" className="ghost-button min-h-11 justify-center">
              Keep ranking
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
