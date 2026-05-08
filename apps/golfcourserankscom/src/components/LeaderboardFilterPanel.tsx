"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  sort: string;
};

export function LeaderboardFilterPanel({ sort }: LeaderboardFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParams(nextSort: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSort && nextSort !== "rank") {
      params.set("sort", nextSort);
    } else {
      params.delete("sort");
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="sticky top-[4.7rem] z-30 rounded-lg border border-line bg-[rgba(255,252,246,0.96)] px-4 py-3 shadow-panel backdrop-blur xl:top-[6.1rem]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="leaderboard-sort" className="text-sm font-semibold text-ink">
          Sort by:
        </label>
        <select
          id="leaderboard-sort"
          value={sort}
          onChange={(event) => updateParams(event.target.value)}
          className="min-h-11 w-full rounded-xs border border-line bg-white px-4 py-2 text-sm font-semibold text-ink outline-none transition focus:border-[rgba(49,107,83,0.45)] sm:w-[18rem]"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
