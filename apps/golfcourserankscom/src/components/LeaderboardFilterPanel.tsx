"use client";

import { useState } from "react";

import { HANDICAP_OPTIONS } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "rank", label: "Crowd rank" },
  { value: "golf-digest-public", label: "Golf Digest" },
  { value: "golf-top-100", label: "GOLF.com" },
  { value: "golfweek-you-can-play", label: "Golfweek" },
  { value: "most-played", label: "Most golfers" },
  { value: "most-compared", label: "Most comparisons" }
] as const;

type LeaderboardFilterPanelProps = {
  band: string;
  selectedState: string;
  sort: string;
  minSignals: number;
  states: string[];
};

function FilterForm({
  band,
  selectedState,
  sort,
  minSignals,
  states,
  compact = false
}: LeaderboardFilterPanelProps & { compact?: boolean }) {
  return (
    <form
      action="/leaderboard"
      className={`grid gap-4 ${compact ? "" : "rounded-[1.9rem] border border-[var(--line)] bg-white/72 p-4 lg:grid-cols-[1fr_1fr_1fr_1.2fr_auto] lg:items-end"}`}
    >
      <div>
        <label className="text-sm font-semibold text-[var(--ink)]">Handicap band</label>
        <select
          name="band"
          defaultValue={band}
          className="mt-2 min-h-11 w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
        >
          <option value="">All golfers</option>
          {HANDICAP_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-[var(--ink)]">State</label>
        <select
          name="state"
          defaultValue={selectedState}
          className="mt-2 min-h-11 w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
        >
          <option value="">All states</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-[var(--ink)]">Sort by</label>
        <select
          name="sort"
          defaultValue={sort}
          className="mt-2 min-h-11 w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-[var(--ink)]">Minimum comparisons</label>
        <input type="range" min="0" max="20" step="1" name="minSignals" defaultValue={String(minSignals)} className="mt-3 w-full" />
        <p className="mt-2 text-sm text-[var(--muted)]">Showing courses with at least {minSignals} comparisons.</p>
      </div>

      <button type="submit" className="solid-button min-h-11 justify-center whitespace-nowrap">
        Apply
      </button>
    </form>
  );
}

export function LeaderboardFilterPanel(props: LeaderboardFilterPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-[5.25rem] z-30 -mx-1 rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,253,249,0.96)] px-3 py-3 shadow-[0_18px_32px_rgba(24,37,43,0.08)] backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--ink)]">Filter the leaderboard</p>
          <button type="button" onClick={() => setOpen(true)} className="ghost-button min-h-11">
            Filters
          </button>
        </div>
      </div>

      <div className="hidden lg:block">
        <FilterForm {...props} />
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-[rgba(17,27,24,0.28)]" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border border-[var(--line)] bg-[rgba(255,253,249,0.98)] p-5 shadow-[0_-20px_55px_rgba(18,28,25,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Filters</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Tune the board without taking over the whole page.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="ghost-button min-h-11">
                Close
              </button>
            </div>
            <div className="mt-5">
              <FilterForm {...props} compact />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
