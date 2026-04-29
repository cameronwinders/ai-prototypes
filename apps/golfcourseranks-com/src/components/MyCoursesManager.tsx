"use client";

import { startTransition, useMemo, useState } from "react";

import { addPlayedCourse, saveCourseOrder } from "@/app/actions";
import { formatLocation } from "@/lib/ranking";
import type { CourseRecord, RankedCourse } from "@/lib/types";

type MyCoursesManagerProps = {
  allCourses: CourseRecord[];
  initialRankings: RankedCourse[];
};

export function MyCoursesManager({ allCourses, initialRankings }: MyCoursesManagerProps) {
  const [rankings, setRankings] = useState(initialRankings);
  const [query, setQuery] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(initialRankings.length > 1 ? "Saved" : null);
  const [busy, setBusy] = useState(false);
  const playedIds = useMemo(() => new Set(rankings.map((course) => course.id)), [rankings]);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const available = allCourses.filter((course) => !playedIds.has(course.id));

    if (!normalized) {
      return available.slice(0, 18);
    }

    return available
      .filter((course) =>
        [course.name, course.city, course.state].some((value) => value.toLowerCase().includes(normalized))
      )
      .slice(0, 18);
  }, [allCourses, playedIds, query]);

  function moveItem(targetId: string, direction: -1 | 1) {
    const currentIndex = rankings.findIndex((course) => course.id === targetId);
    const targetIndex = currentIndex + direction;

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= rankings.length) {
      return;
    }

    const next = [...rankings];
    const [item] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, item);
    persistOrder(next);
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      return;
    }

    const next = [...rankings];
    const fromIndex = next.findIndex((course) => course.id === draggingId);
    const toIndex = next.findIndex((course) => course.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persistOrder(next);
  }

  function persistOrder(next: RankedCourse[]) {
    setRankings(next.map((course, index) => ({ ...course, rankIndex: index })));
    setBusy(true);
    setStatus("Saving...");

    startTransition(async () => {
      const result = await saveCourseOrder(next.map((course) => course.id));

      if (!result.ok || !result.data) {
        setStatus(result.message ?? "We could not save that order.");
        setBusy(false);
        return;
      }

      setRankings(result.data);
      setStatus("Saved");
      setBusy(false);
    });
  }

  function handleAdd(courseId: string) {
    setBusy(true);
    setStatus("Adding...");

    startTransition(async () => {
      const result = await addPlayedCourse(courseId);

      if (!result.ok || !result.data) {
        setStatus(result.message ?? "We could not add that course.");
        setBusy(false);
        return;
      }

      setRankings(result.data);
      setStatus("Saved");
      setBusy(false);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
      <section className="glass-panel rounded-[2rem] p-5 sm:p-6">
        <p className="section-label">Add played courses</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
          Start from the curated national shortlist.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
          Add courses you have played. We drop new additions at the bottom of your stack until you drag them where they belong.
        </p>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by course, city, or state"
          className="mt-5 w-full rounded-[1.3rem] border border-[rgba(24,37,43,0.08)] bg-white px-4 py-3 text-sm outline-none focus:border-[rgba(11,89,69,0.4)]"
        />

        <div className="mt-4 grid gap-3">
          {searchResults.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[rgba(24,37,43,0.12)] px-4 py-5 text-sm text-[var(--muted)]">
              {query
                ? "Nothing else in the seed catalog matches that search."
                : "You’ve already added the visible shortlist."}
            </div>
          ) : (
            searchResults.map((course) => (
              <div
                key={course.id}
                className="rounded-[1.5rem] border border-[rgba(24,37,43,0.08)] bg-white/90 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold tracking-[-0.03em] text-[var(--ink)]">
                      {course.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(course.id)}
                    disabled={busy}
                    className="rounded-full bg-[var(--ink)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-60"
                  >
                    Mark played
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-label">Your ranking stack</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Drag the best round to the top.
            </h2>
          </div>
          <div className="rounded-full border border-[rgba(24,37,43,0.08)] bg-white/85 px-4 py-2 text-sm font-medium text-[var(--muted)]">
            {status ?? `${rankings.length} courses tracked`}
          </div>
        </div>

        {rankings.length === 0 ? (
          <div className="mt-6 rounded-[1.6rem] border border-dashed border-[rgba(24,37,43,0.12)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
            Add your first played course from the left. Once you have at least two, drag-and-drop will appear and we’ll generate pairwise ranking signals for the crowd leaderboard.
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {rankings.map((course, index) => (
              <div
                key={course.id}
                draggable
                onDragStart={() => setDraggingId(course.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(course.id)}
                className="group rounded-[1.7rem] border border-[rgba(24,37,43,0.08)] bg-white/92 p-4 shadow-[0_10px_30px_rgba(24,37,43,0.06)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-[var(--sand)] text-sm font-semibold text-[var(--ink)]">
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                          {course.name}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="drag-handle hidden md:inline-flex">Drag</span>
                        <button
                          type="button"
                          onClick={() => moveItem(course.id, -1)}
                          className="rounded-full border border-[rgba(24,37,43,0.08)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(course.id, 1)}
                          className="rounded-full border border-[rgba(24,37,43,0.08)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
                        >
                          Down
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {rankings.length === 1 ? (
          <p className="mt-5 text-sm text-[var(--muted)]">
            Add one more course to unlock drag-and-drop ordering and pairwise comparison generation.
          </p>
        ) : null}
      </section>
    </div>
  );
}
