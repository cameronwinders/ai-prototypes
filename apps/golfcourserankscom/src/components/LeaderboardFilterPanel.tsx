"use client";

import { useEffect, useState } from "react";
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
  query: string;
};

export function LeaderboardFilterPanel({ sort, query }: LeaderboardFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  function updateParams(nextSort: string, nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSort && nextSort !== "rank") {
      params.set("sort", nextSort);
    } else {
      params.delete("sort");
    }

    const normalizedQuery = nextQuery.trim();
    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    } else {
      params.delete("q");
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams(sort, draftQuery);
  }

  function clearQuery() {
    setDraftQuery("");
    updateParams(sort, "");
  }

  return (
    <div className="sticky top-[4.7rem] z-30 rounded-lg border border-line bg-linen px-4 py-3 xl:top-[6.1rem]">
      <form className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="leaderboard-sort" className="text-sm font-semibold text-ink">
            Sort by:
          </label>
          <select
            id="leaderboard-sort"
            value={sort}
            onChange={(event) => updateParams(event.target.value, draftQuery)}
            className="min-h-11 w-full rounded-xs border border-line bg-white px-4 py-2 text-sm font-semibold text-ink outline-none transition focus:border-[rgba(49,107,83,0.45)] sm:w-[18rem]"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:min-w-[22rem] sm:flex-row sm:items-center lg:justify-end">
          <label htmlFor="leaderboard-search" className="text-sm font-semibold text-ink sm:sr-only">
            Search courses
          </label>
          <input
            id="leaderboard-search"
            type="search"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Search for a course"
            className="min-h-11 w-full rounded-xs border border-line bg-white px-4 py-2 text-sm text-ink outline-none transition focus:border-[rgba(49,107,83,0.45)] sm:min-w-[18rem]"
          />
          <div className="flex gap-2">
            {query ? (
              <button type="button" onClick={clearQuery} className="ghost-button min-h-11 whitespace-nowrap">
                Clear
              </button>
            ) : null}
            <button type="submit" className="solid-button min-h-11 whitespace-nowrap">
              Search
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
