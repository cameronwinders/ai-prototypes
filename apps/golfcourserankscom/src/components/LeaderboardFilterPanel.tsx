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
  minSignals: number;
  states: string[];
};

export function LeaderboardFilterPanel({
  band,
  selectedState,
  sort,
  states
}: LeaderboardFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function updateParams(next: { band?: string; state?: string; sort?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    const nextBand = next.band ?? band;
    const nextState = next.state ?? selectedState;
    const nextSort = next.sort ?? sort;

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

    params.delete("minSignals");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <>
      <div className="sticky top-[4.75rem] z-30 rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,253,249,0.96)] px-3 py-3 shadow-[0_18px_32px_rgba(24,37,43,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <label className="min-w-[8.5rem] flex-1 text-sm font-semibold text-[var(--ink)]">
            <span className="sr-only">State</span>
            <select
              value={selectedState}
              onChange={(event) => updateParams({ state: event.target.value })}
              className="min-h-11 w-full rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] outline-none"
            >
              <option value="">All states</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-[9.5rem] flex-1 text-sm font-semibold text-[var(--ink)]">
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className="min-h-11 w-full rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={() => setOpen(true)} className="ghost-button min-h-11 whitespace-nowrap">
            Filters
          </button>
        </div>

        {band ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">
              Handicap {band}
            </span>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-[rgba(17,27,24,0.28)]" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border border-[var(--line)] bg-[rgba(255,253,249,0.98)] p-5 shadow-[0_-20px_55px_rgba(18,28,25,0.18)] sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[24rem] sm:rounded-none sm:rounded-l-[2rem]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Filters</h2>
              <button type="button" onClick={() => setOpen(false)} className="ghost-button min-h-11">
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Handicap band
                <select
                  value={band}
                  onChange={(event) => updateParams({ band: event.target.value })}
                  className="mt-2 min-h-11 w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="">All golfers</option>
                  {HANDICAP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-[var(--ink)]">
                State
                <select
                  value={selectedState}
                  onChange={(event) => updateParams({ state: event.target.value })}
                  className="mt-2 min-h-11 w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="">All states</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-[var(--ink)]">
                Sort by
                <select
                  value={sort}
                  onChange={(event) => updateParams({ sort: event.target.value })}
                  className="mt-2 min-h-11 w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  updateParams({ band: "", state: "", sort: "rank" });
                  setOpen(false);
                }}
                className="ghost-button min-h-11 justify-center"
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
