import { redirect } from "next/navigation";

import { completeOnboarding } from "@/app/actions";
import { OnboardingCoursePicker } from "@/components/OnboardingCoursePicker";
import { getAllCourses, getPlayedCoursesForUser } from "@/lib/data";
import { HANDICAP_OPTIONS } from "@/lib/types";
import { requireViewer } from "@/lib/viewer";

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
  const next = Array.isArray(nextParam) ? nextParam[0] : nextParam ?? "/leaderboard";
  const step = Array.isArray(stepParam) ? stepParam[0] : stepParam ?? "handicap";
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const playedCourses = viewer.user ? await getPlayedCoursesForUser(viewer.user.id) : [];
  const hasHandicap = Boolean(viewer.profile?.onboarding_completed && viewer.profile?.handicap_band);
  const shouldShowPicker = hasHandicap && playedCourses.length === 0;

  if (hasHandicap && playedCourses.length > 0) {
    redirect(next.startsWith("/") ? next : "/leaderboard");
  }

  if (shouldShowPicker || step === "picker") {
    const courses = await getAllCourses();

    return (
      <div className="mx-auto max-w-6xl">
        <section className="shell-panel p-6 sm:p-8">
          <p className="eyebrow">FIRST RANKING SETUP</p>
          <h1 className="h2 mt-4">Start with the courses you already know</h1>
          <p className="subhed mt-4">
            Save the rounds you have played first, then drag the best ones into order.
          </p>
          <div className="mt-8">
            <OnboardingCoursePicker courses={courses} next="/me/courses" error={error} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section className="shell-panel p-6 sm:p-8">
        <p className="eyebrow">ONBOARDING</p>
        <h1 className="h2 mt-4">One last detail before the leaderboard opens</h1>
        <p className="subhed mt-4">
          Choose the handicap band that best fits your game so the board stays relevant.
        </p>

        {error ? (
          <div className="mt-6 pill pill-warning pill-sentence">{error}</div>
        ) : null}

        <form action={completeOnboarding} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next} />
          <div>
            <p className="eyebrow">HANDICAP BAND</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Pick the range that best matches your current game.
            </p>
          </div>
          <div className="grid gap-3">
            {HANDICAP_OPTIONS.map((option) => (
              <label
                key={option}
                className="block cursor-pointer rounded-[var(--radius-lg)] border border-[rgba(24,37,43,0.08)] bg-white/90 p-5 transition hover:-translate-y-px hover:bg-white has-[:checked]:border-[rgba(49,107,83,0.55)] has-[:checked]:bg-[var(--pine-soft)] has-[:checked]:shadow-[0_0_0_1px_rgba(49,107,83,0.12)]"
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
                    <p className="h3 text-[2rem]">{option}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {option === "0-5"
                        ? "Low-handicap range"
                        : option === "6-10"
                          ? "Competitive regular range"
                          : option === "11-18"
                            ? "Mid-handicap range"
                            : "High-handicap range"}
                    </p>
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
