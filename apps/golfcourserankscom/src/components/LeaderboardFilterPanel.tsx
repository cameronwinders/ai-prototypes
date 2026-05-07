"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HANDICAP_OPTIONS } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "rank", label: "Crowd rank" },
  { value: "golf-digest-public", label: "Golf Digest" },
  { value: "golf-top-100", label: "GOLF.com" },
  { value: "golfweek-you-can-play", label: "Golfweek" },
  { value: "most-played", label: "Most golfers" }
] as const;

type LeaderboardFilterPanelProps = {
  band: string;
  selectedState: string;
  sort: string;
  states: string[];
  activity: string;
  showActivityFilter: boolean;
};

function sortLabel(sort: string) {
  return SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Crowd rank";
}

export function LeaderboardFilterPanel({
  band,
  selectedState,
  sort,
  states,
  activity,
  showActivityFilter
}: LeaderboardFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function updateParams(next: { band?: string; state?: string; sort?: string; activity?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    const nextBand = next.band ?? band;
    const nextState = next.state ?? selectedState;
    const nextSort = next.sort ?? sort;
    const nextActivity = next.activity ?? activity;

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

    params.delete("minSignals");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function resetFilters() {
    updateParams({ band: "", state: "", sort: "rank", activity: "all" });
    setOpen(false);
  }

  return (
    <>
      <div className="sticky top-[4.7rem] z-30 rounded-lg border border-line bg-[rgba(255,252,246,0.96)] px-4 py-3 shadow-panel backdrop-blur xl:top-[6.1rem]">
        <div className="flex items-center justify-between gap-3 sm:hidden">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Filter the leaderboard</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {selectedState ? <span className="pill pill-line pill-sentence">{selectedState}</span> : null}
              <span className="pill pill-line pill-sentence">{sortLabel(sort)}</span>
              {band ? <span className="pill pill-pine pill-sentence">Handicap {band}</span> : null}
              {showActivityFilter && activity !== "all" ? (
                <span className="pill pill-pine pill-sentence">
                  {activity === "played" ? "Played by me" : "Not played by me"}
                </span>
              ) : null}
            </div>
          </div>

          <button type="button" onClick={() => setOpen(true)} className="ghost-button sm min-h-11 shrink-0">
            Filters
          </button>
        </div>

        <div className="hidden flex-wrap items-center gap-2.5 sm:flex">
          <label className="sr-only" htmlFor="leaderboard-state-inline">
            State
          </label>
          <select
            id="leaderboard-state-inline"
            value={selectedState}
            onChange={(event) => updateParams({ state: event.target.value })}
            className="min-h-11 rounded-xs border border-line bg-white px-4 py-2 text-sm font-semibold text-ink outline-none transition focus:border-[rgba(49,107,83,0.45)]"
          >
            <option value="">All states</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

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
          {sort !== "rank" ? <span className="pill pill-line pill-sentence">{sortLabel(sort)}</span> : null}
          {band ? <span className="pill pill-pine pill-sentence">Handicap {band}</span> : null}
          {showActivityFilter && activity !== "all" ? (
            <span className="pill pill-pine pill-sentence">
              {activity === "played" ? "Played by me" : "Not played by me"}
            </span>
          ) : null}

          <button type="button" onClick={() => setOpen(true)} className="ghost-button sm ml-auto min-h-11">
            Filters
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-[rgba(18,28,25,0.36)]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-xl border border-line bg-[rgba(255,252,246,0.98)] p-5 shadow-[0_-20px_60px_rgba(18,28,25,0.22)] sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[26rem] sm:rounded-none sm:rounded-l-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="h2 text-[1.65rem] text-ink">Filters</h2>
              <button type="button" onClick={() => setOpen(false)} className="ghost-button sm min-h-11">
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Handicap band
                <select
                  value={band}
                  onChange={(event) => updateParams({ band: event.target.value })}
                  className="min-h-11 rounded-md border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none transition focus:border-[rgba(49,107,83,0.45)]"
                >
                  <option value="">All golfers</option>
                  {HANDICAP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-ink">
                State
                <select
                  value={selectedState}
                  onChange={(event) => updateParams({ state: event.target.value })}
                  className="min-h-11 rounded-md border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none transition focus:border-[rgba(49,107,83,0.45)]"
                >
                  <option value="">All states</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-ink">
                Sort by
                <select
                  value={sort}
                  onChange={(event) => updateParams({ sort: event.target.value })}
                  className="min-h-11 rounded-md border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none transition focus:border-[rgba(49,107,83,0.45)]"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {showActivityFilter ? (
                <label className="grid gap-2 text-sm font-semibold text-ink">
                  Course state
                  <select
                    value={activity}
                    onChange={(event) => updateParams({ activity: event.target.value })}
                    className="min-h-11 rounded-md border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none transition focus:border-[rgba(49,107,83,0.45)]"
                  >
                    <option value="all">All courses</option>
                    <option value="played">Played by me</option>
                    <option value="not-played">Not played by me</option>
                  </select>
                </label>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={resetFilters} className="ghost-button min-h-11">
                Reset filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
