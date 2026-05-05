"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { setCoursePlayed } from "@/app/actions";
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
  viewerSignedIn,
  viewerNeedsOnboarding,
  defaultVisibleCount = 48
}: CoursesBrowserProps) {
  const [playedCourses, setPlayedCourses] = useState(initialPlayedCourses);
  const [query, setQuery] = useState("");
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);
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
    setStatus(nextPlayed ? "Added to your played list." : "Removed from your played list.");
  }

  const visibleCourses = filteredCourses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCourses.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full max-w-2xl">
          <label className="sr-only" htmlFor="course-directory-search">
            Search courses
          </label>
          <input
            id="course-directory-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by course, city, or state"
            data-testid="courses-search"
            className="w-full rounded-[1.35rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[rgba(49,107,83,0.45)]"
          />
        </div>
        <p className="text-sm font-semibold text-[var(--muted)]">{filteredCourses.length} courses</p>
      </div>

      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}

      {filteredCourses.length === 0 ? (
        <div className="rounded-[1.8rem] border border-dashed border-[var(--line)] bg-white/82 px-5 py-8 text-sm leading-6 text-[var(--muted)]">
          <p>No courses matched that search.</p>
          <Link
            href="/feedback?screen=Courses&from=%2Fcourses&topic=course-addition"
            className="ghost-button mt-4 min-h-11"
          >
            Request a course addition
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {visibleCourses.map((course) => {
              const isPlayed = playedIds.has(course.id);

              return (
                <div key={course.id} data-testid={`course-card-${course.id}`} className="rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-4">
                  <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {course.leaderboard_rank ? (
                          <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">
                            #{course.leaderboard_rank}
                          </span>
                        ) : null}
                        {course.normalized_score !== null && course.normalized_score !== undefined ? (
                          <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                            Crowd score {course.normalized_score.toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-xl font-semibold leading-tight tracking-[-0.03em] text-[var(--ink)]">{course.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                    </div>

                    <div className={`grid gap-2 ${viewerSignedIn ? "sm:grid-cols-2" : ""}`}>
                      <Link href={`/courses/${course.id}`} className="ghost-button min-h-11 justify-center">
                        View detail
                      </Link>
                      {viewerSignedIn ? (
                        viewerNeedsOnboarding ? (
                          <Link
                            href={`/onboarding?next=${encodeURIComponent(`/courses/${course.id}`)}`}
                            className="solid-button min-h-11 justify-center"
                          >
                            Finish profile
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggle(course.id, !isPlayed)}
                            disabled={busyCourseId === course.id}
                            data-testid={`course-play-toggle-${course.id}`}
                            className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${
                              isPlayed ? "border border-[var(--line)] bg-white text-[var(--ink)]" : "bg-[var(--ink)] text-[rgb(255,255,255)]"
                            }`}
                          >
                            {busyCourseId === course.id ? "Saving..." : isPlayed ? "Played" : "Mark played"}
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <button type="button" onClick={() => setVisibleCount((count) => count + defaultVisibleCount)} className="ghost-button min-h-11">
                Show more courses
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
