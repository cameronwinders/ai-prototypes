"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { quickAddCourseToRanking, removeCourseFromRanking, saveCourseOrder, setCoursePlayed } from "@/app/actions";
import { formatLocation, formatUpdatedAt, splitPlayedCourses } from "@/lib/ranking";
import type { CourseRecord, PlayedCourse } from "@/lib/types";

type MyCoursesManagerProps = {
  initialPlayedCourses: PlayedCourse[];
  allCourses: CourseRecord[];
};

const STATE_NAME_BY_CODE: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new hampshire",
  NJ: "new jersey",
  NM: "new mexico",
  NY: "new york",
  NC: "north carolina",
  ND: "north dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhode island",
  SC: "south carolina",
  SD: "south dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "west virginia",
  WI: "wisconsin",
  WY: "wyoming"
};

function mergePlayedCourses(current: PlayedCourse[], ranked: Array<{ id: string; rankPosition: number }>) {
  const rankById = new Map(ranked.map((course) => [course.id, course.rankPosition]));
  return current.map((course) => ({
    ...course,
    rankPosition: rankById.get(course.id) ?? null
  }));
}

export function MyCoursesManager({ initialPlayedCourses, allCourses }: MyCoursesManagerProps) {
  const [playedCourses, setPlayedCourses] = useState(initialPlayedCourses);
  const [activeTab, setActiveTab] = useState<"ranked" | "unranked">("ranked");
  const [status, setStatus] = useState<string>("Drag to reorder. Top means favorite.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(new Date().toISOString());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const latestServerState = useRef(initialPlayedCourses);
  const latestState = useRef(initialPlayedCourses);
  const savingRef = useRef(false);
  const queuedOrderRef = useRef<string[] | null>(null);

  useEffect(() => {
    latestState.current = playedCourses;
  }, [playedCourses]);

  const { ranked, unranked } = useMemo(() => splitPlayedCourses(playedCourses), [playedCourses]);
  const rankedIds = useMemo(() => new Set(ranked.map((course) => course.id)), [ranked]);
  const playedIds = useMemo(() => new Set(playedCourses.map((course) => course.id)), [playedCourses]);
  const filteredCatalog = useMemo(() => {
    const normalized = catalogQuery.trim().toLowerCase();

    if (!normalized) {
      return allCourses.slice(0, 18);
    }

    return allCourses
      .filter((course) => {
        const stateName = STATE_NAME_BY_CODE[course.state.toUpperCase()] ?? "";
        return [course.name, course.city, course.state, stateName].some((value) =>
          value.toLowerCase().includes(normalized)
        );
      })
      .slice(0, 24);
  }, [allCourses, catalogQuery]);

  async function flushOrder(orderIds: string[]) {
    if (savingRef.current) {
      queuedOrderRef.current = orderIds;
      return;
    }

    savingRef.current = true;
    setSaveError(null);
    setStatus("Saving order...");

    const result = await saveCourseOrder(orderIds);

    if (!result.ok || !result.data) {
      setPlayedCourses(latestServerState.current);
      setSaveError(result.message ?? "We could not save that order.");
      setStatus("Save failed. We rolled back to the last saved order.");
      savingRef.current = false;
      queuedOrderRef.current = null;
      return;
    }

    const updated = mergePlayedCourses(latestState.current, result.data);
    latestServerState.current = updated;
    setPlayedCourses(updated);
    setLastSavedAt(result.message ?? new Date().toISOString());
    setStatus("Saved");
    savingRef.current = false;

    if (queuedOrderRef.current) {
      const queued = queuedOrderRef.current;
      queuedOrderRef.current = null;
      await flushOrder(queued);
    }
  }

  function applyOptimisticOrder(orderIds: string[]) {
    const next = mergePlayedCourses(
      latestState.current,
      orderIds.map((id, index) => ({
        id,
        rankPosition: index
      }))
    );
    setPlayedCourses(next);
    void flushOrder(orderIds);
  }

  function handleMove(courseId: string, direction: -1 | 1) {
    const currentIndex = ranked.findIndex((course) => course.id === courseId);
    const targetIndex = currentIndex + direction;

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= ranked.length) {
      return;
    }

    const next = [...ranked];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    applyOptimisticOrder(next.map((course) => course.id));
    setAnnouncement(`${moved.name} moved to rank ${targetIndex + 1}.`);
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      return;
    }

    const fromIndex = ranked.findIndex((course) => course.id === draggingId);
    const toIndex = ranked.findIndex((course) => course.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const next = [...ranked];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    applyOptimisticOrder(next.map((course) => course.id));
    setAnnouncement(`${moved.name} moved to rank ${toIndex + 1}.`);
    setDraggingId(null);
  }

  async function handleQuickAdd(courseId: string) {
    setBusyCourseId(courseId);
    const result = await quickAddCourseToRanking(courseId);
    setBusyCourseId(null);

    if (!result.ok || !result.data) {
      setSaveError(result.message ?? "We could not add that course to the ranking.");
      return;
    }

    latestServerState.current = result.data;
    setPlayedCourses(result.data);
    setLastSavedAt(new Date().toISOString());
    setStatus(result.message ?? "Saved");
    setActiveTab("ranked");
  }

  async function handleRemoveFromRanking(courseId: string) {
    setBusyCourseId(courseId);
    const result = await removeCourseFromRanking(courseId);
    setBusyCourseId(null);

    if (!result.ok || !result.data) {
      setSaveError(result.message ?? "We could not remove that course from the ranking.");
      return;
    }

    latestServerState.current = result.data;
    setPlayedCourses(result.data);
    setLastSavedAt(new Date().toISOString());
    setStatus("Saved");
    setActiveTab("unranked");
  }

  async function handleUnplay(courseId: string) {
    setBusyCourseId(courseId);
    const result = await setCoursePlayed(courseId, false);
    setBusyCourseId(null);

    if (!result.ok || !result.data) {
      setSaveError(result.message ?? "We could not remove that course.");
      return;
    }

    latestServerState.current = result.data;
    setPlayedCourses(result.data);
    setLastSavedAt(new Date().toISOString());
    setStatus("Saved");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <section className="shell-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-label">My ranking list</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Rank the public courses you have actually played.
            </h2>
          </div>

          <div className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-medium text-[var(--muted)]">
            {status} {lastSavedAt ? `| Last saved ${formatUpdatedAt(lastSavedAt)}` : ""}
          </div>
        </div>

        {saveError ? (
          <div className="mt-4 rounded-[1.4rem] border border-[rgba(126,58,58,0.14)] bg-[rgba(126,58,58,0.08)] px-4 py-3 text-sm text-[var(--ink)]">
            {saveError}
          </div>
        ) : null}

        <div className="mt-6 flex gap-2 rounded-full border border-[var(--line)] bg-white/80 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("ranked")}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold ${
              activeTab === "ranked" ? "bg-[var(--ink)] text-[rgb(255,255,255)]" : "text-[var(--muted)]"
            }`}
          >
            Ranked
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("unranked")}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold ${
              activeTab === "unranked" ? "bg-[var(--ink)] text-[rgb(255,255,255)]" : "text-[var(--muted)]"
            }`}
          >
            Needs ranking
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          Drag with the handle on larger screens or use the move buttons anywhere. Every saved order helps shape the national leaderboard.
        </p>

        <div className="sr-only" aria-live="polite">
          {announcement}
        </div>

        {activeTab === "ranked" ? (
          ranked.length === 0 ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
              No ranked courses yet. Mark a few courses as played, then drop them into your list once you know the order.
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {ranked.map((course) => (
                <div
                  key={course.id}
                  data-testid={`ranked-course-${course.id}`}
                  draggable
                  onDragStart={() => setDraggingId(course.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(course.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-4 shadow-[0_10px_30px_rgba(24,37,43,0.06)] ${
                    draggingId === course.id ? "opacity-80" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-[var(--sand)] text-sm font-semibold text-[var(--ink)]">
                      #{course.rankPosition + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{course.name}</h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="drag-handle hidden md:inline-flex">Drag</span>
                          <button type="button" onClick={() => handleMove(course.id, -1)} className="ghost-button min-h-11">
                            Up
                          </button>
                          <button type="button" onClick={() => handleMove(course.id, 1)} className="ghost-button min-h-11">
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromRanking(course.id)}
                            className="ghost-button min-h-11"
                          >
                            Unrank
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : unranked.length === 0 ? (
          <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
            Every played course is already in your ranking. Add more the next time you want to expand your list.
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {unranked.map((course) => (
              <div key={course.id} data-testid={`unranked-course-${course.id}`} className="rounded-[1.6rem] border border-[var(--line)] bg-white/90 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{course.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(course.id)}
                      disabled={busyCourseId === course.id}
                      data-testid={`add-to-ranking-${course.id}`}
                      className="solid-button min-h-11"
                    >
                      {busyCourseId === course.id ? "Adding..." : "Add to ranking"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnplay(course.id)}
                      disabled={busyCourseId === course.id}
                      className="ghost-button min-h-11"
                    >
                      Remove played
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 border-t border-[rgba(24,37,43,0.08)] pt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="section-label">Add from the leaderboard</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                Search and add the public courses you have already played.
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                This list starts in national leaderboard order, so you can keep adding courses to your ranking list without leaving the page.
              </p>
            </div>

            <label className="block w-full max-w-xl text-sm font-semibold text-[var(--ink)]">
              Search by course, city, or state
              <input
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
                placeholder="Pebble, Bandon, Scottsdale, Wisconsin..."
                className="mt-2 w-full rounded-[1.35rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[rgba(49,107,83,0.45)]"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3">
            {filteredCatalog.map((course) => {
              const isRanked = rankedIds.has(course.id);
              const isPlayed = playedIds.has(course.id);

              return (
                <div key={course.id} className="rounded-[1.6rem] border border-[var(--line)] bg-white/90 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {course.leaderboard_rank ? (
                          <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">
                            National rank #{course.leaderboard_rank}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                          Editorial start #{course.seed_rank}
                        </span>
                      </div>
                      <h4 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{course.name}</h4>
                      <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/courses/${course.id}`} className="ghost-button min-h-11">
                        View detail
                      </Link>
                      {isRanked ? (
                        <span className="rounded-full bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[rgb(255,255,255)]">
                          In ranking
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(course.id)}
                          disabled={busyCourseId === course.id}
                          className="solid-button min-h-11"
                        >
                          {busyCourseId === course.id
                            ? "Adding..."
                            : isPlayed
                              ? "Add to ranking list"
                              : "Mark played + add"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="shell-panel rounded-[2rem] p-6">
          <p className="section-label">Where to next</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Keep your golf list moving.
          </h3>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Mark more public courses as played, then decide whether they belong in your order. You can keep a course logged without ranking it right away.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Link href="/courses" className="solid-button min-h-11 justify-center">
              Browse courses
            </Link>
            <Link href="/leaderboard" className="ghost-button min-h-11 justify-center">
              See the leaderboard
            </Link>
          </div>
        </section>

        <section className="shell-panel rounded-[2rem] p-6">
          <p className="section-label">Your progress</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: "Played", value: playedCourses.length },
              { label: "Ranked", value: ranked.length },
              { label: "Needs ranking", value: unranked.length }
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] bg-white/82 px-4 py-4">
                <p className="text-sm text-[var(--muted)]">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
