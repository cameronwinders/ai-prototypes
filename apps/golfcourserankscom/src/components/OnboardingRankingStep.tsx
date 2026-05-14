"use client";

import { useState } from "react";

import { completeOnboardingRankingStep } from "@/app/actions";
import { formatLocation } from "@/lib/ranking";
import type { RankedCourse } from "@/lib/types";

type OnboardingRankingStepProps = {
  initialCourses: RankedCourse[];
  next: string;
  error?: string | null;
  inviterName?: string | null;
};

export function OnboardingRankingStep({
  initialCourses,
  next,
  error,
  inviterName = null
}: OnboardingRankingStepProps) {
  const [courses, setCourses] = useState(initialCourses);

  function moveCourse(courseId: string, direction: -1 | 1) {
    setCourses((current) => {
      const index = current.findIndex((course) => course.id === courseId);
      const targetIndex = index + direction;

      if (index === -1 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const nextCourses = [...current];
      const [moved] = nextCourses.splice(index, 1);
      nextCourses.splice(targetIndex, 0, moved);
      return nextCourses.map((course, nextIndex) => ({
        ...course,
        rankPosition: nextIndex
      }));
    });
  }

  function moveCourseToTop(courseId: string) {
    setCourses((current) => {
      const index = current.findIndex((course) => course.id === courseId);

      if (index <= 0) {
        return current;
      }

      const nextCourses = [...current];
      const [moved] = nextCourses.splice(index, 1);
      nextCourses.unshift(moved);
      return nextCourses.map((course, nextIndex) => ({
        ...course,
        rankPosition: nextIndex
      }));
    });
  }

  return (
    <form action={completeOnboardingRankingStep} className="space-y-6">
      <input type="hidden" name="next" value={next} />
      {courses.map((course) => (
        <input key={course.id} type="hidden" name="course_ids" value={course.id} />
      ))}

      <div className="max-w-3xl">
        <p className="eyebrow">STEP 3 OF 4</p>
        <h2 className="h3 mt-4">Put your played courses in order</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          {inviterName
            ? `Before you compare with ${inviterName}, rank these public courses by which were your overall favorite to play.`
            : "Rank these public courses by which were your overall favorite to play."}
        </p>
      </div>

      {error ? <div className="pill pill-warning pill-sentence">{error}</div> : null}

      <div className="grid gap-3">
        {courses.map((course) => (
          <div key={course.id} className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/92 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="pill pill-pine">#{course.rankPosition + 1}</span>
                </div>
                <h3 className="h3 mt-4 text-[1.35rem]">{course.name}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
              </div>

              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <button type="button" onClick={() => moveCourseToTop(course.id)} className="ghost-button sm justify-center">
                  Top
                </button>
                <button type="button" onClick={() => moveCourse(course.id, -1)} className="ghost-button sm justify-center">
                  Up
                </button>
                <button type="button" onClick={() => moveCourse(course.id, 1)} className="ghost-button sm justify-center">
                  Down
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-3 z-20 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[rgba(255,253,249,0.96)] p-4 shadow-[var(--shadow-panel)] backdrop-blur sm:bottom-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Keep your favorite at the top</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              You can adjust this later, but ranking them now gives you a real comparison right away.
            </p>
          </div>
          <button type="submit" className="solid-button justify-center">
            Continue to name
          </button>
        </div>
      </div>
    </form>
  );
}
