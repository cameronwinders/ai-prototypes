"use client";

import { useState } from "react";
import Link from "next/link";

import { setCoursePlayed, setCourseWishlisted } from "@/app/actions";
import { PlayedMarkIcon } from "@/components/PlayedMarkIcon";
import { formatLocation } from "@/lib/ranking";
import type { WishlistCourse } from "@/lib/types";

type WishlistManagerProps = {
  initialCourses: WishlistCourse[];
};

export function WishlistManager({ initialCourses }: WishlistManagerProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleRemove(courseId: string) {
    setBusyCourseId(courseId);
    setStatus(null);
    const result = await setCourseWishlisted(courseId, false);
    setBusyCourseId(null);

    if (!result.ok) {
      setStatus(result.message ?? "We could not update that wish list spot.");
      return;
    }

    setCourses((current) => current.filter((course) => course.id !== courseId));
    setStatus("Removed from your wish list.");
  }

  async function handleMarkPlayed(courseId: string) {
    setBusyCourseId(courseId);
    setStatus(null);
    const result = await setCoursePlayed(courseId, true);
    setBusyCourseId(null);

    if (!result.ok) {
      setStatus(result.message ?? "We could not mark that course as played.");
      return;
    }

    setCourses((current) => current.filter((course) => course.id !== courseId));
    setStatus("Marked played and moved out of your wish list.");
  }

  return (
    <section className="shell-panel-soft p-6 sm:p-8">
      <div className="space-y-6">
        <header className="space-y-4">
          <p className="eyebrow">WISH LIST</p>
          <h1 className="h2">Keep future rounds in one stack</h1>
          <p className="subhed">
            Save the public courses you still want to play, then move them into your played list once the trip actually happens.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="pill pill-pine pill-sentence">{courses.length} saved for later</span>
            <Link href="/courses" className="ghost-button">
              Browse more courses
            </Link>
            <Link href="/me/courses" className="ghost-button">
              Open my courses
            </Link>
          </div>
        </header>

        {status ? <p className="meta">{status}</p> : null}

        {courses.length === 0 ? (
          <section className="shell-panel-contrast p-8 text-center">
            <p className="eyebrow">NOTHING SAVED YET</p>
            <h2 className="h3 mt-4">Your next golf trip starts here</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Browse the course directory and tap Add to wish list on anything you want to keep in the conversation.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/courses" className="solid-button">
                Browse courses
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid gap-3">
            {courses.map((course) => (
              <div key={course.id} className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/92 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      {course.leaderboard_rank ? <span className="pill pill-pine">#{course.leaderboard_rank}</span> : null}
                      <span className="pill pill-line">Wish list</span>
                    </div>
                    <h2 className="h3 mt-4 text-[1.35rem]">{course.name}</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                  </div>

                  <div className="grid gap-2 sm:flex sm:flex-wrap">
                    <Link href={`/courses/${course.id}`} className="ghost-button sm">
                      View detail
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleMarkPlayed(course.id)}
                      disabled={busyCourseId === course.id}
                      className="solid-button sm justify-center gap-2"
                    >
                      <PlayedMarkIcon className="h-3.5 w-3.5" />
                      {busyCourseId === course.id ? "Saving..." : "Mark played"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(course.id)}
                      disabled={busyCourseId === course.id}
                      className="ghost-button sm justify-center"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
