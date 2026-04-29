"use client";

import { useState } from "react";
import Link from "next/link";

import { setCoursePlayed } from "@/app/actions";
import type { PlayedCourse } from "@/lib/types";

type CourseDetailActionsProps = {
  courseId: string;
  initialPlayed: PlayedCourse | null;
  viewerSignedIn: boolean;
  viewerNeedsOnboarding: boolean;
};

export function CourseDetailActions({
  courseId,
  initialPlayed,
  viewerSignedIn,
  viewerNeedsOnboarding
}: CourseDetailActionsProps) {
  const [played, setPlayed] = useState(Boolean(initialPlayed));
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onToggle() {
    setPending(true);
    setStatus(null);
    const result = await setCoursePlayed(courseId, !played);
    setPending(false);

    if (!result.ok) {
      setStatus(result.message ?? "We could not update your played list.");
      return;
    }

    setPlayed(!played);
    setStatus(!played ? "Added to your played list." : "Removed from your played list.");
  }

  if (!viewerSignedIn) {
    return (
      <Link href={`/sign-in?next=${encodeURIComponent(`/courses/${courseId}`)}`} className="solid-button min-h-11 justify-center">
        Sign in to log it
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {viewerNeedsOnboarding ? (
        <Link
          href={`/onboarding?next=${encodeURIComponent(`/courses/${courseId}`)}`}
          className="solid-button min-h-11 justify-center"
        >
          Finish profile to log courses
        </Link>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          data-testid="course-detail-play-toggle"
          className="solid-button min-h-11 justify-center"
        >
          {pending ? "Saving..." : played ? "Marked played" : "Mark as played"}
        </button>
      )}
      <Link href="/me/courses" className="ghost-button min-h-11 justify-center">
        Open My Courses
      </Link>
      {viewerNeedsOnboarding ? (
        <p className="text-sm text-[var(--muted)]">Complete your handicap band first so your played list contributes to the right leaderboard slice.</p>
      ) : null}
      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
    </div>
  );
}
