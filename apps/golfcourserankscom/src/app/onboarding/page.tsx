import { completeOnboarding } from "@/app/actions";
import { HANDICAP_OPTIONS } from "@/lib/types";
import { requireViewer } from "@/lib/viewer";
import { redirect } from "next/navigation";

export default async function OnboardingPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer("/onboarding");
  const params = await searchParams;
  const nextParam = params.next;
  const errorParam = params.error;
  const next = Array.isArray(nextParam) ? nextParam[0] : nextParam ?? "/leaderboard";
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  if (viewer.profile?.onboarding_completed && viewer.profile.handicap_band) {
    redirect(next.startsWith("/") ? next : "/leaderboard");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section className="shell-panel rounded-[2.4rem] p-6 sm:p-8">
        <p className="section-label">Onboarding</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          One last detail before the leaderboard opens.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          Phase 1 only needs your handicap band. No home region, no tees, no long profile questionnaire.
        </p>

        {error ? (
          <div className="mt-6 rounded-[1.5rem] border border-[rgba(126,58,58,0.14)] bg-[rgba(126,58,58,0.08)] px-4 py-3 text-sm text-[var(--ink)]">
            {error}
          </div>
        ) : null}

        <form action={completeOnboarding} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next} />
          <div className="grid gap-3 sm:grid-cols-2">
            {HANDICAP_OPTIONS.map((option) => (
              <label
                key={option}
                className="cursor-pointer rounded-[1.7rem] border border-[rgba(24,37,43,0.08)] bg-white/90 p-5 transition hover:bg-white"
              >
                <input
                  type="radio"
                  name="handicap_band"
                  value={option}
                  defaultChecked={viewer.profile?.handicap_band === option}
                  className="sr-only"
                />
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">Handicap band</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{option}</p>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white"
          >
            Save and enter leaderboard
          </button>
        </form>
      </section>
    </div>
  );
}
