import { redirect } from "next/navigation";

import { completeOnboarding, completeOnboardingNameStep } from "@/app/actions";
import { OnboardingCoursePicker } from "@/components/OnboardingCoursePicker";
import { OnboardingRankingStep } from "@/components/OnboardingRankingStep";
import { getAllCourses, getPlayedCoursesForUser, getProfileByHandle, getRankedCoursesForUser } from "@/lib/data";
import { HANDICAP_OPTIONS } from "@/lib/types";
import { requireViewer } from "@/lib/viewer";

function getInviteHandle(next: string) {
  const normalized = decodeURIComponent(next);
  const match = normalized.match(/\/invite\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

export default async function OnboardingPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer("/onboarding");
  const params = await searchParams;
  const nextParam = params.next;
  const stepParam = params.step;
  const errorParam = params.error;
  const next = Array.isArray(nextParam) ? nextParam[0] : nextParam ?? "/rankings";
  const step = Array.isArray(stepParam) ? stepParam[0] : stepParam ?? "handicap";
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const playedCourses = viewer.user ? await getPlayedCoursesForUser(viewer.user.id) : [];
  const rankedCourses = viewer.user ? await getRankedCoursesForUser(viewer.user.id) : [];
  const inviteHandle = getInviteHandle(next);
  const inviter = inviteHandle ? await getProfileByHandle(inviteHandle) : null;
  const inviterPlayedIds = inviter ? new Set((await getPlayedCoursesForUser(inviter.id)).map((course) => course.id)) : new Set<string>();
  const inviterName = inviter?.display_name ?? inviter?.handle ?? null;
  const hasHandicap = Boolean(viewer.profile?.handicap_band);
  const isCompleted = Boolean(viewer.profile?.onboarding_completed && viewer.profile?.handicap_band);
  const shouldShowPicker = hasHandicap && playedCourses.length === 0;
  const needsInviteRanking = Boolean(inviterName && playedCourses.length > 0 && rankedCourses.length === 0);
  const shouldShowNameStep = hasHandicap && playedCourses.length > 0 && !viewer.profile?.onboarding_completed && !needsInviteRanking;

  if (isCompleted) {
    redirect(next.startsWith("/") ? next : "/rankings");
  }

  if (step === "name" && !hasHandicap) {
    redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  }

  if (step === "name" && playedCourses.length === 0) {
    redirect(`/onboarding?step=picker&next=${encodeURIComponent(next)}`);
  }

  if (step === "name" && inviterName && rankedCourses.length === 0) {
    redirect(`/onboarding?step=ranking&next=${encodeURIComponent(next)}`);
  }

  if ((step === "ranking" || needsInviteRanking) && inviterName) {
    return (
      <div className="mx-auto max-w-4xl">
        <section className="shell-panel p-6 sm:p-8">
          <OnboardingRankingStep
            initialCourses={rankedCourses}
            next={next.startsWith("/") ? next : "/rankings"}
            error={error}
            inviterName={inviterName}
          />
        </section>
      </div>
    );
  }

  if (shouldShowNameStep || step === "name") {
    return (
      <div className="mx-auto max-w-3xl">
        <section className="shell-panel p-6 sm:p-8">
          <p className="eyebrow">{inviterName ? "STEP 4 OF 4" : "STEP 3 OF 3"}</p>
          <h1 className="h2">Add your name if you want it on your list</h1>
          <p className="subhed mt-4">
            This part is optional. If you skip it, we will keep using the current name based on your email address.
          </p>
          {inviterName ? (
          <div className="mt-6 rounded-[var(--radius-md)] border border-[rgba(49,107,83,0.16)] bg-[rgba(216,231,221,0.72)] px-4 py-3 text-sm leading-7 text-[var(--pine)]">
              You are almost done. Add your name if you want, then we will send you back to compare with <span className="font-semibold text-[var(--ink)]">{inviterName}</span>.
          </div>
          ) : null}

          {error ? (
            <div className="mt-6 pill pill-warning pill-sentence">{error}</div>
          ) : null}

          <form action={completeOnboardingNameStep} className="mt-8 space-y-5">
            <input type="hidden" name="next" value={next} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[var(--ink)]">
                First name
                <input
                  type="text"
                  name="first_name"
                  placeholder="Optional"
                  className="mt-2 min-w-0 w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[rgba(49,107,83,0.45)]"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--ink)]">
                Last name
                <input
                  type="text"
                  name="last_name"
                  placeholder="Optional"
                  className="mt-2 min-w-0 w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[rgba(49,107,83,0.45)]"
                />
              </label>
            </div>

            <p className="text-sm leading-7 text-[var(--muted)]">
              Adding your name helps friends recognize your rankings faster, but you can skip this and keep moving.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="solid-button">
                Finish setup
              </button>
              <button type="submit" className="ghost-button">
                Skip for now
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  if (shouldShowPicker || step === "picker") {
    const courses = await getAllCourses();

    return (
      <div className="mx-auto max-w-6xl">
        <section className="shell-panel p-6 sm:p-8">
          <p className="eyebrow">{inviterName ? "COMPARE SETUP" : "FIRST RANKING SETUP"}</p>
          <h1 className="h2">{inviterName ? `Start with the courses you and ${inviterName} are most likely to know` : "Start with the courses you already know"}</h1>
          <p className="subhed mt-4">
            {inviterName
              ? `${inviterName} invited you to compare public-course lists. Save the rounds you have played first, then rank them before you add your name if you want.`
              : "Save the rounds you have played first, then add your name if you want before ranking them."}
          </p>
          <div className="mt-8">
            <OnboardingCoursePicker
              courses={courses}
              next={next.startsWith("/") ? next : "/rankings"}
              error={error}
              inviterName={inviterName}
              highlightedCourseIds={Array.from(inviterPlayedIds)}
            />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section className="shell-panel p-6 sm:p-8">
        <p className="eyebrow">{inviterName ? "FRIEND INVITE" : "ONBOARDING"}</p>
        <h1 className="h2">
          {inviterName ? `${inviterName} invited you. Start with your handicap band.` : "One last detail before the leaderboard opens"}
        </h1>
        <p className="subhed mt-4">
          {inviterName
            ? `Choose the handicap band that best fits your game so your first comparison with ${inviterName} feels relevant.`
            : "Choose the handicap band that best fits your game so the board stays relevant."}
        </p>

        {error ? (
          <div className="mt-6 pill pill-warning pill-sentence">{error}</div>
        ) : null}

        <form action={completeOnboarding} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next} />
          <div className="grid gap-2">
            {HANDICAP_OPTIONS.map((option) => (
              <label
                key={option}
                className="block cursor-pointer rounded-[var(--radius-lg)] border border-[rgba(24,37,43,0.08)] bg-white/90 p-4 transition hover:-translate-y-px hover:bg-white has-[:checked]:border-transparent has-[:checked]:bg-[var(--pine-soft)] has-[:checked]:shadow-[inset_3px_0_0_var(--pine),0_4px_14px_rgba(49,107,83,0.08)]"
              >
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    name="handicap_band"
                    value={option}
                    defaultChecked={viewer.profile?.handicap_band === option}
                    className="mt-1 h-5 w-5 accent-[var(--pine)]"
                  />
                  <div className="min-w-0">
                    <p className="h3 text-[1.65rem]">{option}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button type="submit" className="solid-button">
            Continue to played courses
          </button>
        </form>
      </section>
    </div>
  );
}
