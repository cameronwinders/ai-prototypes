"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { setCoursePlayed } from "@/app/actions";
import { formatLocation, getPriceBandLabel } from "@/lib/ranking";
import type { CourseRecord, PlayedCourse } from "@/lib/types";

type CoursesBrowserProps = {
  courses: CourseRecord[];
  initialPlayedCourses: PlayedCourse[];
  viewerSignedIn: boolean;
  viewerNeedsOnboarding: boolean;
  defaultVisibleCount?: number;
};

export function CoursesBrowser({
  courses,
  initialPlayedCourses,
  viewerSignedIn,
  viewerNeedsOnboarding,
  defaultVisibleCount
}: CoursesBrowserProps) {
  const [playedCourses, setPlayedCourses] = useState(initialPlayedCourses);
  const [query, setQuery] = useState("");
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const playedIds = useMemo(() => new Set(playedCourses.map((course) => course.id)), [playedCourses]);

  const filteredCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return defaultVisibleCount ? courses.slice(0, defaultVisibleCount) : courses;
    }

    return courses.filter((course) =>
      [course.name, course.city, course.state].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [courses, defaultVisibleCount, query]);

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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="section-label">Seeded course catalog</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Search the curated national shortlist.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Phase 1 keeps the leaderboard universe tight on purpose. These are the seeded U.S. public courses that can earn national rank movement right now.
          </p>
        </div>

        <label className="w-full max-w-xl text-sm font-semibold text-[var(--ink)]">
          Search by course, city, or state
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pebble, Bandon, Scottsdale, Wisconsin..."
            data-testid="courses-search"
            className="mt-2 w-full rounded-[1.35rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[rgba(49,107,83,0.45)]"
          />
        </label>
      </div>

      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}

      <div className="grid gap-3">
        {filteredCourses.map((course) => {
          const isPlayed = playedIds.has(course.id);

          return (
            <div key={course.id} data-testid={`course-card-${course.id}`} className="rounded-[1.7rem] border border-[var(--line)] bg-white/90 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">
                      Seed #{course.seed_rank}
                    </span>
                    {course.seed_source?.seed_tier ? (
                      <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        {course.seed_source.seed_tier}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{course.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                    <span>Par {course.par ?? "—"}</span>
                    <span>Slope {course.slope ?? "—"}</span>
                    <span>Rating {course.rating ?? "—"}</span>
                    <span>{getPriceBandLabel(course.price_band)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/courses/${course.id}`} className="ghost-button min-h-11">
                    View detail
                  </Link>
                  {viewerSignedIn ? (
                    viewerNeedsOnboarding ? (
                      <Link
                        href={`/onboarding?next=${encodeURIComponent(`/courses/${course.id}`)}`}
                        className="solid-button min-h-11"
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
                          isPlayed ? "border border-[var(--line)] bg-white text-[var(--ink)]" : "bg-[var(--ink)] text-white"
                        }`}
                      >
                        {busyCourseId === course.id ? "Saving..." : isPlayed ? "Played" : "Mark played"}
                      </button>
                    )
                  ) : (
                    <Link href={`/sign-in?next=${encodeURIComponent(`/courses/${course.id}`)}`} className="solid-button min-h-11">
                      Sign in to log it
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
