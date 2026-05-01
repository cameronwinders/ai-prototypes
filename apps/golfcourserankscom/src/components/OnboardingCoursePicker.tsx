"use client";

import { useMemo, useState } from "react";

import { completeOnboardingCourseSelection } from "@/app/actions";
import { formatLocation } from "@/lib/ranking";
import type { CourseRecord } from "@/lib/types";

type OnboardingCoursePickerProps = {
  courses: CourseRecord[];
  next: string;
  error?: string | null;
};

export function OnboardingCoursePicker({ courses, next, error }: OnboardingCoursePickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scope, setScope] = useState<"all" | "top50">("all");
  const [stateFilter, setStateFilter] = useState("ALL");

  const states = useMemo(
    () =>
      Array.from(new Set(courses.map((course) => course.state))).sort((left, right) =>
        left.localeCompare(right)
      ),
    [courses]
  );

  const visibleCourses = useMemo(() => {
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

  function toggleCourse(courseId: string) {
    setSelectedIds((current) =>
      current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId]
    );
  }

  return (
    <form action={completeOnboardingCourseSelection} className="space-y-6">
      <input type="hidden" name="next" value={next} />
      {selectedIds.map((courseId) => (
        <input key={courseId} type="hidden" name="course_ids" value={courseId} />
      ))}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">Step 2 of 2</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Pick the public courses you have already played.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Pick 5–15 to get the most out of ranking. We will drop them into your played list first, then you can drag your favorites into order.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`ghost-button min-h-11 ${scope === "all" ? "bg-[var(--ink)] text-white" : ""}`}
            style={scope === "all" ? { color: "#ffffff", WebkitTextFillColor: "#ffffff" } : undefined}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setScope("top50")}
            className={`ghost-button min-h-11 ${scope === "top50" ? "bg-[var(--ink)] text-white" : ""}`}
            style={scope === "top50" ? { color: "#ffffff", WebkitTextFillColor: "#ffffff" } : undefined}
          >
            Top 50
          </button>
          <label className="text-sm font-semibold text-[var(--ink)]">
            <span className="sr-only">Filter by state</span>
            <select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
              className="min-h-11 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]"
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

      {error ? (
        <div className="rounded-[1.5rem] border border-[rgba(126,58,58,0.14)] bg-[rgba(126,58,58,0.08)] px-4 py-3 text-sm text-[var(--ink)]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleCourses.map((course) => {
          const selected = selectedIds.includes(course.id);
          const badgeValue = course.leaderboard_rank ?? course.seed_rank;

          return (
            <button
              key={course.id}
              type="button"
              onClick={() => toggleCourse(course.id)}
              className={`min-h-[10rem] rounded-[1.8rem] border p-4 text-left transition ${
                selected
                  ? "border-[rgba(49,107,83,0.65)] bg-[var(--pine-soft)] shadow-[0_0_0_2px_rgba(49,107,83,0.12)]"
                  : "border-[var(--line)] bg-white/90 hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-[rgba(24,37,43,0.06)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Rank #{badgeValue}
                </span>
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold ${
                    selected
                      ? "border-[rgba(49,107,83,0.65)] bg-[var(--pine)] text-white"
                      : "border-[var(--line)] bg-white text-[var(--muted)]"
                  }`}
                >
                  {selected ? "✓" : "+"}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{course.name}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-4 z-20 rounded-[1.8rem] border border-[var(--line)] bg-[rgba(255,253,249,0.96)] p-4 shadow-[0_20px_40px_rgba(24,37,43,0.12)] backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              Continue with {selectedIds.length} {selectedIds.length === 1 ? "course" : "courses"} →
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">Rank your first 5–15 courses in under a minute.</p>
          </div>
          <button
            type="submit"
            disabled={selectedIds.length === 0}
            className="solid-button min-h-11 justify-center disabled:cursor-not-allowed disabled:opacity-45"
          >
            Continue with {selectedIds.length} course{selectedIds.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </form>
  );
}
