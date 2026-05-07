"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { setCoursePlayed, setCourseWishlisted } from "@/app/actions";
import { PlayedButton, WantToPlayButton } from "@/components/PlayActions";
import { WishlistIcon } from "@/components/WishlistIcon";
import { formatLocation } from "@/lib/ranking";
import type { CourseRecord, PlayedCourse } from "@/lib/types";

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

type CoursesBrowserProps = {
  courses: CourseRecord[];
  initialPlayedCourses: PlayedCourse[];
  initialWishlistIds: string[];
  viewerSignedIn: boolean;
  viewerNeedsOnboarding: boolean;
  defaultVisibleCount?: number;
};

function normalizeCourseKey(course: CourseRecord) {
  const normalizedName = course.name
    .toLowerCase()
    .replace(/ak[\s-]?chin/g, "ak chin")
    .replace(/\bthe links at\b/g, "")
    .replace(/\bbig cedar lodge\b/g, "big cedar")
    .replace(/\b(golf|course|resort|lodge)\b/g, "")
    .replace(/[():'.,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `${normalizedName}|${course.city.toLowerCase()}|${course.state.toLowerCase()}`;
}

function choosePreferredCourse(existing: CourseRecord, candidate: CourseRecord) {
  const scoreCourse = (course: CourseRecord) =>
    (course.leaderboard_rank ? 10_000 - course.leaderboard_rank : 0) +
    (course.normalized_score ?? 0) * 10 +
    (course.par ? 3 : 0) +
    (course.slope ? 2 : 0) +
    (course.rating ? 2 : 0);

  return scoreCourse(candidate) > scoreCourse(existing) ? candidate : existing;
}

export function CoursesBrowser({
  courses,
  initialPlayedCourses,
  initialWishlistIds,
  viewerSignedIn,
  viewerNeedsOnboarding,
  defaultVisibleCount = 30
}: CoursesBrowserProps) {
  const [playedCourses, setPlayedCourses] = useState(initialPlayedCourses);
  const [wishlistIds, setWishlistIds] = useState(new Set(initialWishlistIds));
  const [query, setQuery] = useState("");
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);
  const [wishlistBusyCourseId, setWishlistBusyCourseId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(defaultVisibleCount);
  const playedIds = useMemo(() => new Set(playedCourses.map((course) => course.id)), [playedCourses]);

  const dedupedCourses = useMemo(() => {
    const byKey = new Map<string, CourseRecord>();

    for (const course of courses) {
      const key = normalizeCourseKey(course);
      const existing = byKey.get(key);
      byKey.set(key, existing ? choosePreferredCourse(existing, course) : course);
    }

    return Array.from(byKey.values());
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return dedupedCourses;
    }

    return dedupedCourses.filter((course) => {
      const stateName = STATE_NAME_BY_CODE[course.state.toUpperCase()] ?? "";
      return [course.name, course.city, course.state, stateName].some((value) =>
        value.toLowerCase().includes(normalized)
      );
    });
  }, [dedupedCourses, query]);

  useEffect(() => {
    setVisibleCount(defaultVisibleCount);
  }, [defaultVisibleCount, query]);

  useEffect(() => {
    setWishlistIds(new Set(initialWishlistIds));
  }, [initialWishlistIds]);

  async function handleToggle(courseId: string, nextPlayed: boolean) {
    if (!viewerSignedIn || viewerNeedsOnboarding) {
      return;
    }

    setBusyCourseId(courseId);
    setStatus(null);
    const result = await setCoursePlayed(courseId, nextPlayed);
    setBusyCourseId(null);

    if (!result.ok || !result.data) {
      setStatus(result.message ?? "We could not update that played state.");
      return;
    }

    setPlayedCourses(result.data);
    setWishlistIds((current) => {
      const next = new Set(current);
      if (nextPlayed) {
        next.delete(courseId);
      }
      return next;
    });
    setStatus(nextPlayed ? "Added to your played list." : "Removed from your played list.");
  }

  async function handleWishlist(courseId: string, nextWishlisted: boolean) {
    if (!viewerSignedIn || viewerNeedsOnboarding) {
      return;
    }

    setWishlistBusyCourseId(courseId);
    setStatus(null);
    const result = await setCourseWishlisted(courseId, nextWishlisted);
    setWishlistBusyCourseId(null);

    if (!result.ok) {
      setStatus(result.message ?? "We could not update that wish list state.");
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

  const visibleCourses = filteredCourses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCourses.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="block w-full max-w-2xl">
          <span className="sr-only">Search courses</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by course, city, or state"
            data-testid="courses-search"
            className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-[rgba(49,107,83,0.45)]"
          />
        </label>
        <p className="text-sm font-semibold text-muted">{filteredCourses.length} courses</p>
      </div>

      {status ? <p className="meta">{status}</p> : null}

      {filteredCourses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white/82 px-5 py-8 text-sm leading-6 text-muted">
          <p>No courses matched that search.</p>
          <Link href="/feedback?screen=Courses&from=%2Fcourses&topic=course-addition" className="ghost-button mt-4 min-h-11">
            Request a course addition
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {visibleCourses.map((course) => {
              const isPlayed = playedIds.has(course.id);
              const isWishlisted = wishlistIds.has(course.id);

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  data-testid={`course-card-${course.id}`}
                  className="block rounded-lg border border-line bg-white/92 p-4 transition-[background-color,transform] duration-150 hover:-translate-y-px hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        {course.leaderboard_rank ? <span className="pill pill-pine">#{course.leaderboard_rank}</span> : null}
                        {course.normalized_score !== null && course.normalized_score !== undefined ? (
                          <span className={`pill ${course.num_unique_golfers === 0 ? "pill-warning" : "pill-line"} pill-sentence`}>
                            {course.num_unique_golfers === 0 ? "Starting score" : "Crowd score"} {course.normalized_score.toFixed(1)}
                          </span>
                        ) : null}
                        {isPlayed ? (
                          <PlayedButton className="pointer-events-none" />
                        ) : isWishlisted ? (
                          <span className="pill pill-line gap-1.5">
                            <WishlistIcon className="h-3.5 w-3.5" filled />
                            Wish list
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-[1.12rem] font-semibold tracking-[var(--tracking-tight)] text-ink sm:text-[1.2rem]">{course.name}</h3>
                      <p className="meta mt-1">{formatLocation(course)}</p>
                    </div>

                    <span className="shrink-0 pt-1 text-lg text-muted" aria-hidden="true">
                      &gt;
                    </span>
                  </div>

                  {viewerSignedIn ? (
                    <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap" onClick={(event) => event.preventDefault()}>
                      {viewerNeedsOnboarding ? (
                        <Link href={`/onboarding?next=${encodeURIComponent(`/courses/${course.id}`)}`} className="solid-button sm min-h-11 justify-center">
                          Finish profile
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggle(course.id, !isPlayed)}
                          disabled={busyCourseId === course.id}
                          data-testid={`course-play-toggle-${course.id}`}
                          className={isPlayed ? "ghost-button sm min-h-11 justify-center" : "solid-button sm min-h-11 justify-center"}
                        >
                          {busyCourseId === course.id ? "Saving..." : isPlayed ? "Played" : "Mark played"}
                        </button>
                      )}
                      {!viewerNeedsOnboarding && !isPlayed ? (
                        wishlistBusyCourseId === course.id ? (
                          <button type="button" disabled className="ghost-button sm min-h-11 justify-center">
                            Saving...
                          </button>
                        ) : (
                          <WantToPlayButton
                            saved={isWishlisted}
                            onClick={() => handleWishlist(course.id, !isWishlisted)}
                            className="min-h-11 justify-center"
                            labelOn="On your list"
                            labelOff="Want to play"
                          />
                        )
                      ) : null}
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <button type="button" onClick={() => setVisibleCount((count) => count + defaultVisibleCount)} className="ghost-button min-h-11">
                More courses
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
