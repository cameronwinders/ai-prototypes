"use client";

import { useEffect, useMemo, useState } from "react";

import { completeOnboardingCourseSelection } from "@/app/actions";
import { formatLocation } from "@/lib/ranking";
import type { CourseRecord } from "@/lib/types";

type OnboardingCoursePickerProps = {
  courses: CourseRecord[];
  next: string;
  error?: string | null;
};

const PAGE_SIZE = 25;

export function OnboardingCoursePicker({ courses, next, error }: OnboardingCoursePickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scope, setScope] = useState<"all" | "top50">("all");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const states = useMemo(
    () => Array.from(new Set(courses.map((course) => course.state))).sort((left, right) => left.localeCompare(right)),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (scope === "top50" && (course.leaderboard_rank ?? course.seed_rank) > 50) {
        return false;
      }

      if (stateFilter !== "ALL" && course.state !== stateFilter) {
        return false;
      }

      return true;
    });
  }, [courses, scope, stateFilter]);

  const visibleCourses = useMemo(() => filteredCourses.slice(0, visibleCount), [filteredCourses, visibleCount]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [scope, stateFilter]);

  function toggleCourse(courseId: string) {
    setSelectedIds((current) =>
      current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId]
    );
  }

  const hasMore = visibleCount < filteredCourses.length;

  return (
    <form action={completeOnboardingCourseSelection} className="space-y-6">
      <input type="hidden" name="next" value={next} />
      {selectedIds.map((courseId) => (
        <input key={courseId} type="hidden" name="course_ids" value={courseId} />
      ))}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow">STEP 2 OF 2</p>
          <h2 className="h3 mt-4">Pick the public courses you have already played</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Pick 5 to 15 to get the most out of ranking. We will save them as played first, then bring you straight into your list.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => setScope("all")}
            className={scope === "all" ? "solid-button sm" : "ghost-button sm"}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setScope("top50")}
            className={scope === "top50" ? "solid-button sm" : "ghost-button sm"}
          >
            Top 50
          </button>
          <label className="col-span-2 text-sm font-medium text-[var(--ink)] sm:col-auto">
            <span className="sr-only">Filter by state</span>
            <select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
              className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm"
            >
              <option value="ALL">All states</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? <div className="pill pill-warning pill-sentence">{error}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleCourses.map((course) => {
          const selected = selectedIds.includes(course.id);
          const badgeValue = course.leaderboard_rank ?? course.seed_rank;

          return (
            <button
              key={course.id}
              type="button"
              onClick={() => toggleCourse(course.id)}
              className={`min-h-[10rem] rounded-[var(--radius-lg)] border p-4 text-left transition ${
                selected
                  ? "border-[rgba(49,107,83,0.52)] bg-[var(--pine-soft)] shadow-[0_0_0_1px_rgba(49,107,83,0.1)]"
                  : "border-[var(--line)] bg-white/90 hover:-translate-y-px hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={selected ? "pill pill-pine" : "pill pill-line"}>Rank #{badgeValue}</span>
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] border text-[11px] font-semibold ${
                    selected
                      ? "border-[rgba(49,107,83,0.65)] bg-[var(--pine)] text-[rgb(255,255,255)]"
                      : "border-[var(--line)] bg-white text-[var(--muted)]"
                  }`}
                >
                  {selected ? "\u2713" : "+"}
                </span>
              </div>
              <h3 className="h3 mt-4 text-[1.25rem] sm:text-[1.35rem]">{course.name}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
            </button>
          );
        })}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="ghost-button">
            More courses {"\u25BE"}
          </button>
        </div>
      ) : null}

      <div className="sticky bottom-3 z-20 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[rgba(255,253,249,0.96)] p-4 shadow-[var(--shadow-panel)] backdrop-blur sm:bottom-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              Continue with {selectedIds.length} {selectedIds.length === 1 ? "course" : "courses"} {"\u2192"}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">Pick 5 to 15 to get the most out of ranking.</p>
          </div>
          <button
            type="submit"
            disabled={selectedIds.length === 0}
            className="solid-button justify-center disabled:cursor-not-allowed disabled:opacity-45"
          >
            Continue with {selectedIds.length} course{selectedIds.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </form>
  );
}
