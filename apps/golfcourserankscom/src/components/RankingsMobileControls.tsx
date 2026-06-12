"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { MobileSheet } from "@/components/MobileSheet";

const SORT_OPTIONS = [
  { value: "rank", label: "Crowd rank" },
  { value: "editorial-average", label: "Editorial average" },
  { value: "crowd-vs-editorial", label: "Crowd vs. editorial" },
  { value: "golf-digest-public", label: "Golf Digest" },
  { value: "golf-top-100", label: "GOLF.com" },
  { value: "golfweek-you-can-play", label: "Golf Week" },
  { value: "most-played", label: "Most played" }
] as const;

type RankingsMobileControlsProps = {
  sort: string;
  query: string;
  resultCount: number;
};

/**
 * Mobile-only rankings controls (design-system spec): a sticky bar with a
 * "Sort: <label>" button that opens a bottom sheet of sort options, plus a
 * search field. Both drive the same `sort` / `q` URL params the server page
 * reads — no client-side data fetching, so the data layer is untouched.
 */
export function RankingsMobileControls({ sort, query, resultCount }: RankingsMobileControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  const sortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Crowd rank";

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

    const next = params.toString();
    router.push(next ? `${pathname}?${next}` : pathname);
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
    <div className="lg:hidden">
      <div className="sticky top-0 z-10 flex items-center gap-2 bg-[var(--linen)] py-2">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="ghost-button shrink-0 gap-2"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="2,5 8,11 14,5" />
          </svg>
          <span className="truncate">Sort: {sortLabel}</span>
        </button>

        <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--m-radius-md)] border border-line bg-white px-3" style={{ minHeight: "var(--m-touch)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5 L14 14" />
          </svg>
          <input
            type="search"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Search courses"
            aria-label="Search courses"
            className="min-w-0 flex-1 border-none bg-transparent py-2.5 text-base text-ink outline-none [appearance:none] [&::-webkit-search-cancel-button]:hidden"
          />
          {draftQuery ? (
            <button type="button" onClick={clearQuery} aria-label="Clear search" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--m-radius-sm)] text-muted">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M4 4 L12 12 M12 4 L4 12" />
              </svg>
            </button>
          ) : null}
        </form>
      </div>

      <MobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Sort by"
        footer={
          <button type="button" className="solid-button block" onClick={() => setSheetOpen(false)}>
            Show {resultCount} {resultCount === 1 ? "course" : "courses"}
          </button>
        }
      >
        <div className="m-list">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="m-list-row"
              aria-pressed={sort === option.value}
              onClick={() => {
                updateParams(option.value, draftQuery);
                setSheetOpen(false);
              }}
            >
              <span className="label">{option.label}</span>
              <span className="check">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="4 11 8 15 16 5" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </MobileSheet>
    </div>
  );
}
