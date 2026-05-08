"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HANDICAP_OPTIONS, RANK_SIGNAL_OPTIONS, type RankSignalFilter } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "rank", label: "Crowd rank" },
  { value: "editorial-average", label: "Editorial average" },
  { value: "crowd-vs-editorial", label: "Crowd vs. editorial" },
  { value: "golf-digest-public", label: "Golf Digest" },
  { value: "golf-top-100", label: "GOLF.com" },
  { value: "golfweek-you-can-play", label: "Golf Week" },
  { value: "most-played", label: "Most played" }
] as const;

type LeaderboardFilterPanelProps = {
  band: string;
  selectedState: string;
  sort: string;
  states: string[];
  activity: string;
  signal: RankSignalFilter;
  showActivityFilter: boolean;
};

export function LeaderboardFilterPanel({
  band,
  selectedState,
  sort,
  states,
  activity,
  signal,
  showActivityFilter
}: LeaderboardFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParams(next: { band?: string; state?: string; sort?: string; activity?: string; signal?: RankSignalFilter }) {
    const params = new URLSearchParams(searchParams.toString());

    const nextBand = next.band ?? band;
    const nextState = next.state ?? selectedState;
    const nextSort = next.sort ?? sort;
    const nextActivity = next.activity ?? activity;
    const nextSignal = next.signal ?? signal;

    if (nextBand) {
      params.set("band", nextBand);
    } else {
      params.delete("band");
    }

    if (nextState) {
      params.set("state", nextState);
    } else {
      params.delete("state");
    }

    if (nextSort && nextSort !== "rank") {
      params.set("sort", nextSort);
    } else {
      params.delete("sort");
    }

    if (showActivityFilter && nextActivity && nextActivity !== "all") {
      params.set("played", nextActivity);
    } else {
      params.delete("played");
    }

    if (nextSignal && nextSignal !== "all") {
      params.set("tag", nextSignal);
    } else {
      params.delete("tag");
    }

    params.delete("minSignals");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function resetFilters() {
    updateParams({ band: "", state: "", sort: "rank", activity: "all", signal: "all" });
  }

  return (
    <>
      <div className="sticky top-[4.7rem] z-30 rounded-lg border border-line bg-[rgba(255,252,246,0.96)] px-4 py-3 shadow-panel backdrop-blur xl:top-[6.1rem]">
        <div className="flex items-center justify-between gap-3 sm:hidden">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Sort by</p>
            <label className="sr-only" htmlFor="leaderboard-sort-mobile">
              Sort by
            </label>
            <select
              id="leaderboard-sort-mobile"
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className="mt-2 min-h-11 w-full rounded-xs border border-line bg-white px-4 py-2 text-sm font-semibold text-ink outline-none transition focus:border-[rgba(49,107,83,0.45)]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-1 flex flex-wrap gap-2">
              {selectedState ? <span className="pill pill-line pill-sentence">{selectedState}</span> : null}
              {band ? <span className="pill pill-pine pill-sentence">Handicap {band}</span> : null}
              {signal !== "all" ? (
                <span className="pill pill-line pill-sentence">
                  {RANK_SIGNAL_OPTIONS.find((option) => option.value === signal)?.label ?? "Tag"}
                </span>
              ) : null}
              {showActivityFilter && activity !== "all" ? (
                <span className="pill pill-pine pill-sentence">
                  {activity === "played" ? "Played by me" : "Not played by me"}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hidden flex-wrap items-center gap-2.5 sm:flex">
          <label className="sr-only" htmlFor="leaderboard-sort-inline">
            Sort by
          </label>
          <select
            id="leaderboard-sort-inline"
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className="min-h-11 rounded-xs border border-line bg-white px-4 py-2 text-sm font-semibold text-ink outline-none transition focus:border-[rgba(49,107,83,0.45)]"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {selectedState ? <span className="pill pill-line pill-sentence">{selectedState}</span> : null}
          {band ? <span className="pill pill-pine pill-sentence">Handicap {band}</span> : null}
          {signal !== "all" ? (
            <span className="pill pill-line pill-sentence">
              {RANK_SIGNAL_OPTIONS.find((option) => option.value === signal)?.label ?? "Tag"}
            </span>
          ) : null}
          {showActivityFilter && activity !== "all" ? (
            <span className="pill pill-pine pill-sentence">
              {activity === "played" ? "Played by me" : "Not played by me"}
            </span>
          ) : null}
        </div>
        {selectedState || band || signal !== "all" || (showActivityFilter && activity !== "all") ? (
          <button type="button" onClick={resetFilters} className="ghost-button sm ml-auto min-h-11">
            Reset filters
          </button>
        ) : null}
      </div>
    </>
  );
}
