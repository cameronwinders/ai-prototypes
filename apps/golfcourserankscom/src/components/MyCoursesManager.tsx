"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { addCourseToRanking, removeCourseFromRanking, saveCourseOrder, setCoursePlayed, setCourseWishlisted } from "@/app/actions";
import { WantToPlayButton } from "@/components/PlayActions";
import { ShareButton } from "@/components/ShareButton";
import { formatLocation, formatUpdatedAt, splitPlayedCourses } from "@/lib/ranking";
import type { CourseRecord, PlayedCourse } from "@/lib/types";

type MyCoursesManagerProps = {
  initialPlayedCourses: PlayedCourse[];
  initialWishlistIds: string[];
  allCourses: CourseRecord[];
  siteUrl: string;
  viewerHandle: string;
  inviteUrl: string;
};

type DragState = {
  id: string;
  source: "ranked" | "unranked";
} | null;

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

const CATALOG_PAGE_SIZE = 18;

function mergePlayedCourses(current: PlayedCourse[], ranked: Array<{ id: string; rankPosition: number }>) {
  const rankById = new Map(ranked.map((course) => [course.id, course.rankPosition]));
  return current.map((course) => ({
    ...course,
    rankPosition: rankById.get(course.id) ?? null
  }));
}

export function MyCoursesManager({
  initialPlayedCourses,
  initialWishlistIds,
  allCourses,
  siteUrl,
  viewerHandle,
  inviteUrl
}: MyCoursesManagerProps) {
  const [playedCourses, setPlayedCourses] = useState(initialPlayedCourses);
  const [wishlistIds, setWishlistIds] = useState(new Set(initialWishlistIds));
  const [status, setStatus] = useState<string>("On mobile, use Top, Up, and Down to rank your favorites.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(new Date().toISOString());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);
  const [wishlistBusyCourseId, setWishlistBusyCourseId] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogVisibleCount, setCatalogVisibleCount] = useState(CATALOG_PAGE_SIZE);
  const [announcement, setAnnouncement] = useState("");
  const [dragState, setDragState] = useState<DragState>(null);
  const latestServerState = useRef(initialPlayedCourses);
  const latestState = useRef(initialPlayedCourses);
  const savingRef = useRef(false);
  const queuedOrderRef = useRef<string[] | null>(null);

  useEffect(() => {
    latestState.current = playedCourses;
  }, [playedCourses]);

  useEffect(() => {
    setWishlistIds(new Set(initialWishlistIds));
  }, [initialWishlistIds]);

  useEffect(() => {
    setCatalogVisibleCount(CATALOG_PAGE_SIZE);
  }, [catalogQuery]);

  const { ranked, unranked } = useMemo(() => splitPlayedCourses(playedCourses), [playedCourses]);
  const rankedIds = useMemo(() => new Set(ranked.map((course) => course.id)), [ranked]);
  const playedIds = useMemo(() => new Set(playedCourses.map((course) => course.id)), [playedCourses]);
  const filteredCatalog = useMemo(() => {
    const normalized = catalogQuery.trim().toLowerCase();
    return allCourses
      .filter((course) => {
        const stateName = STATE_NAME_BY_CODE[course.state.toUpperCase()] ?? "";
        return [course.name, course.city, course.state, stateName].some((value) =>
          value.toLowerCase().includes(normalized)
        );
      });
  }, [allCourses, catalogQuery]);
  const visibleCatalog = useMemo(
    () => filteredCatalog.slice(0, catalogVisibleCount),
    [catalogVisibleCount, filteredCatalog]
  );
  const hasMoreCatalogCourses = catalogVisibleCount < filteredCatalog.length;

  function syncPlayedState(next: PlayedCourse[]) {
    latestServerState.current = next;
    latestState.current = next;
    setPlayedCourses(next);
  }

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
    syncPlayedState(updated);
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
    latestState.current = next;
    setPlayedCourses(next);
    void flushOrder(orderIds);
  }

  function buildNextRankedIds(targetId?: string | null) {
    if (!dragState) {
      return ranked.map((course) => course.id);
    }

    const withoutDragged = ranked.filter((course) => course.id !== dragState.id).map((course) => course.id);

    if (!targetId) {
      return [...withoutDragged, dragState.id];
    }

    const targetIndex = withoutDragged.indexOf(targetId);
    if (targetIndex === -1) {
      return [...withoutDragged, dragState.id];
    }

    withoutDragged.splice(targetIndex, 0, dragState.id);
    return withoutDragged;
  }

  function commitRankDrop(targetId?: string | null) {
    if (!dragState) {
      return;
    }

    const nextIds = buildNextRankedIds(targetId);
    const newIndex = nextIds.indexOf(dragState.id);
    const movedCourse = playedCourses.find((course) => course.id === dragState.id);

    applyOptimisticOrder(nextIds);

    if (movedCourse) {
      setAnnouncement(`${movedCourse.name} moved into rank ${newIndex + 1}.`);
    }

    setDragState(null);
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

  function handleMoveToTop(courseId: string) {
    const currentIndex = ranked.findIndex((course) => course.id === courseId);

    if (currentIndex <= 0) {
      return;
    }

    const next = [...ranked];
    const [moved] = next.splice(currentIndex, 1);
    next.unshift(moved);
    applyOptimisticOrder(next.map((course) => course.id));
    setAnnouncement(`${moved.name} moved to rank 1.`);
  }

  async function handleRemoveFromRanking(courseId: string) {
    setBusyCourseId(courseId);
    const result = await removeCourseFromRanking(courseId);
    setBusyCourseId(null);

    if (!result.ok || !result.data) {
      setSaveError(result.message ?? "We could not remove that course from the ranking.");
      return;
    }

    syncPlayedState(result.data);
    setLastSavedAt(new Date().toISOString());
    setStatus("Saved");
  }

  async function handleAddToRanking(courseId: string) {
    setBusyCourseId(courseId);
    const result = await addCourseToRanking(courseId);
    setBusyCourseId(null);

    if (!result.ok || !result.data) {
      setSaveError(result.message ?? "We could not add that course to your ranking.");
      return;
    }

    const updated = mergePlayedCourses(latestServerState.current, result.data);
    syncPlayedState(updated);
    setLastSavedAt(new Date().toISOString());
    setStatus("Saved");

    const movedCourse = updated.find((course) => course.id === courseId);
    if (movedCourse?.rankPosition != null) {
      setAnnouncement(`${movedCourse.name} added at rank ${movedCourse.rankPosition + 1}.`);
    }
  }

  async function handleUnplay(courseId: string) {
    setBusyCourseId(courseId);
    const result = await setCoursePlayed(courseId, false);
    setBusyCourseId(null);

    if (!result.ok || !result.data) {
      setSaveError(result.message ?? "We could not remove that course.");
      return;
    }

    syncPlayedState(result.data);
    setLastSavedAt(new Date().toISOString());
    setStatus("Saved");
  }

  async function handleMarkPlayed(courseId: string) {
    setBusyCourseId(courseId);
    const result = await setCoursePlayed(courseId, true);
    setBusyCourseId(null);

    if (!result.ok || !result.data) {
      setSaveError(result.message ?? "We could not add that course to your played list.");
      return;
    }

    syncPlayedState(result.data);
    setWishlistIds((current) => {
      const next = new Set(current);
      next.delete(courseId);
      return next;
    });
    setLastSavedAt(new Date().toISOString());
    setStatus("Added to your played list.");
  }

  async function handleWishlist(courseId: string, nextWishlisted: boolean) {
    setWishlistBusyCourseId(courseId);
    const result = await setCourseWishlisted(courseId, nextWishlisted);
    setWishlistBusyCourseId(null);

    if (!result.ok) {
      setSaveError(result.message ?? "We could not update that wish list spot.");
      return;
    }

    setWishlistIds((current) => {
      const next = new Set(current);
      if (nextWishlisted) {
        next.add(courseId);
      } else {
        next.delete(courseId);
      }
      return next;
    });
    setStatus(nextWishlisted ? "Added to your wish list." : "Removed from your wish list.");
  }

  return (
    <section className="shell-panel-soft p-6 sm:p-8">
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      <div className="space-y-8">
        <header className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="eyebrow">MY COURSES</p>
              <h1 className="h2">Your public-course stack</h1>
              <p className="subhed mt-4">
                Rank the courses based on which were your overall favorite to play.
              </p>
            </div>
            <div className="pill pill-line pill-sentence self-start">
              {status}
              {lastSavedAt ? ` | Last saved ${formatUpdatedAt(lastSavedAt)}` : ""}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto_auto_auto] xl:items-center">
            {[
              { label: "Played", value: playedCourses.length },
              { label: "Ranked", value: ranked.length },
              { label: "Waiting below", value: unranked.length }
            ].map((item) => (
              <div key={item.label} className="shell-panel-contrast p-4">
                <p className="meta">{item.label}</p>
                <p className="mt-3 text-[2rem] font-semibold tracking-[var(--tracking-tight)] text-[var(--ink)]">
                  {item.value}
                </p>
              </div>
            ))}

            <ShareButton
              title="Share my Golf Course Rankings"
              text="See how I rank public golf courses on Golf Course Ranks."
              url={`${siteUrl}/u/${viewerHandle}?utm_source=share&utm_medium=top10card&utm_campaign=user_share`}
              className="ghost-button justify-center whitespace-nowrap"
              analyticsSurface="my-courses-top10"
              buttonChildren="Share my rankings"
            />
            <ShareButton
              title="Join me on Golf Course Ranks"
              text="Compare your public-course rankings with mine on Golf Course Ranks."
              url={inviteUrl}
              className="ghost-button justify-center whitespace-nowrap"
              analyticsSurface="my-courses-invite"
              buttonChildren="Invite friends"
            />
            <Link href="/courses" className="ghost-button justify-center whitespace-nowrap">
              Browse courses
            </Link>
            <Link href="/me/wishlist" className="ghost-button justify-center whitespace-nowrap">
              Open wish list
            </Link>
            <Link href="/rankings" className="ghost-button justify-center whitespace-nowrap">
              See leaderboard
            </Link>
          </div>
        </header>

        {saveError ? (
          <div className="pill pill-warning pill-sentence">{saveError}</div>
        ) : null}

        {ranked.length >= 5 ? (
          <section className="shell-panel-contrast p-5">
            <p className="eyebrow">SHARE YOUR LIST</p>
            <h2 className="h3">Your rankings are ready to share</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              Once you have a real top five, the best growth loop is inviting another golfer to stack their list beside yours.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ShareButton
                title="Share my Golf Course Rankings"
                text="See how I rank public golf courses on Golf Course Ranks."
                url={`${siteUrl}/u/${viewerHandle}?utm_source=share&utm_medium=top10card&utm_campaign=user_share`}
                className="solid-button"
                analyticsSurface="my-courses-top10-prompt"
                buttonChildren="Share my rankings"
              />
              <ShareButton
                title="Join me on Golf Course Ranks"
                text="Compare your public-course rankings with mine on Golf Course Ranks."
                url={inviteUrl}
                className="ghost-button"
                analyticsSurface="my-courses-invite-prompt"
                buttonChildren="Invite friends"
              />
            </div>
          </section>
        ) : null}

        {playedCourses.length === 0 ? (
          <section className="shell-panel-contrast p-8 text-center">
            <p className="eyebrow">START YOUR LIST</p>
            <h2 className="h3">Add your first course</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Mark the public courses you have already played, then rank the best ones into order.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/courses" className="solid-button justify-center">
                Browse courses
              </Link>
              <Link href="/rankings" className="ghost-button justify-center">
                See the leaderboard
              </Link>
            </div>
          </section>
        ) : null}

        <section className="shell-panel-contrast p-6 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">RANKING</p>
              <h2 className="h3">Rank the public courses you have actually played</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                On mobile, use Top, Up, and Down to set the order. The top slot is your favorite.
              </p>
            </div>
            <div className="pill pill-line pill-sentence self-start">{ranked.length} ranked</div>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">RANKED</p>
                <span className="meta">Top means favorite</span>
              </div>

              {ranked.length === 0 ? (
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => commitRankDrop(null)}
                  className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] bg-white/70 px-5 py-8 text-sm leading-7 text-[var(--muted)]"
                >
                  {playedCourses.length === 0
                    ? "Once you add a course you have played, use Add to ranking below to start your list."
                    : "Use Add to ranking below when a played course deserves a spot. Your first addition becomes rank #1."}
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {ranked.map((course) => (
                    <div
                      key={course.id}
                      data-testid={`ranked-course-${course.id}`}
                      draggable
                      onDragStart={() => setDragState({ id: course.id, source: "ranked" })}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => commitRankDrop(course.id)}
                      onDragEnd={() => setDragState(null)}
                      className={`rounded-[var(--radius-md)] border border-[var(--line)] bg-white/92 p-4 shadow-[var(--shadow-card)] ${
                        dragState?.id === course.id ? "opacity-80" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="pill pill-pine shrink-0">#{course.rankPosition + 1}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <h3 className="h3 text-[1.45rem]">{course.name}</h3>
                              <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button type="button" onClick={() => handleMoveToTop(course.id)} className="ghost-button sm md:hidden">
                                Top
                              </button>
                              <button type="button" onClick={() => handleMove(course.id, -1)} className="ghost-button sm">
                                Up
                              </button>
                              <button type="button" onClick={() => handleMove(course.id, 1)} className="ghost-button sm">
                                Down
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromRanking(course.id)}
                                disabled={busyCourseId === course.id}
                                className="ghost-button sm"
                              >
                                Move below
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => commitRankDrop(null)}
                    className="rounded-[var(--radius-md)] border border-dashed border-[rgba(24,37,43,0.1)] bg-white/66 px-4 py-4 text-sm text-[var(--muted)]"
                  >
                    Use Top, Up, and Down to keep this order honest.
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[var(--line)] pt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">PLAYED BUT UNRANKED</p>
                <span className="meta">{unranked.length} waiting</span>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                These courses are already in your played list. Use Add to ranking whenever one earns a place in your ordered list.
              </p>

              {unranked.length === 0 ? (
                <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] bg-white/70 px-5 py-8 text-sm leading-7 text-[var(--muted)]">
                  Every played course is already ranked. Add another played course below when you want to expand the stack.
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {unranked.map((course) => (
                    <div
                      key={course.id}
                      data-testid={`unranked-course-${course.id}`}
                      draggable
                      onDragStart={() => setDragState({ id: course.id, source: "unranked" })}
                      onDragEnd={() => setDragState(null)}
                      className={`rounded-[var(--radius-md)] border border-[var(--line)] bg-white/90 p-4 ${
                        dragState?.id === course.id ? "opacity-80" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="h3 text-[1.35rem]">{course.name}</h3>
                          </div>
                          <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddToRanking(course.id)}
                        disabled={busyCourseId === course.id}
                            className="solid-button sm"
                          >
                            {busyCourseId === course.id ? "Saving..." : "Add to ranking"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnplay(course.id)}
                            disabled={busyCourseId === course.id}
                            className="ghost-button sm"
                          >
                            Remove played
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="shell-panel-contrast p-6 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">ADD MORE COURSES</p>
              <h2 className="h3">Search and mark more public courses as played</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                This list starts in national leaderboard order. Once you mark a course as played, it drops into the unranked section above.
              </p>
            </div>

            <label className="block w-full max-w-xl text-sm font-medium text-[var(--ink)]">
              <span className="sr-only">Search by course, city, or state</span>
              <input
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
                placeholder="Search by course, city, or state"
                className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[rgba(49,107,83,0.45)]"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3">
            {visibleCatalog.map((course) => {
              const isRanked = rankedIds.has(course.id);
              const isPlayed = playedIds.has(course.id);
              const isWishlisted = wishlistIds.has(course.id);

              return (
                <div key={course.id} className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/90 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {course.leaderboard_rank ? <span className="pill pill-pine">National rank #{course.leaderboard_rank}</span> : null}
                        <span className="pill pill-line">Editorial start #{course.seed_rank}</span>
                      </div>
                      <h3 className="h3 mt-4 text-[1.35rem]">{course.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/courses/${course.id}`} className="ghost-button sm">
                        View detail
                      </Link>
                      {isRanked ? (
                        <span className="pill pill-ink">In ranking</span>
                      ) : isPlayed ? (
                        <span className="pill pill-line">In played list</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMarkPlayed(course.id)}
                            disabled={busyCourseId === course.id}
                            className="solid-button sm"
                          >
                            {busyCourseId === course.id ? "Saving..." : "Mark played"}
                          </button>
                          {wishlistBusyCourseId === course.id ? (
                            <button type="button" disabled className="ghost-button sm">
                              Saving...
                            </button>
                          ) : (
                            <WantToPlayButton
                              saved={isWishlisted}
                              onClick={() => handleWishlist(course.id, !isWishlisted)}
                              className="sm"
                              labelOn="On your list"
                              labelOff="Want to play"
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMoreCatalogCourses ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setCatalogVisibleCount((current) => current + CATALOG_PAGE_SIZE)}
                className="ghost-button"
              >
                Load more courses
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}

