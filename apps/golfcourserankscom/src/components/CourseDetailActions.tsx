"use client";

import { useState } from "react";
import Link from "next/link";

import { setCoursePlayed, setCourseWishlisted } from "@/app/actions";
import { WantToPlayButton } from "@/components/PlayActions";
import type { PlayedCourse } from "@/lib/types";

type CourseDetailActionsProps = {
  courseId: string;
  initialPlayed: PlayedCourse | null;
  initialWishlisted: boolean;
  viewerSignedIn: boolean;
  viewerNeedsOnboarding: boolean;
};

export function CourseDetailActions({
  courseId,
  initialPlayed,
  initialWishlisted,
  viewerSignedIn,
  viewerNeedsOnboarding
}: CourseDetailActionsProps) {
  const [played, setPlayed] = useState(Boolean(initialPlayed));
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, setPending] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
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
    if (!played) {
      setWishlisted(false);
    }
    setStatus(!played ? "Added to your played list." : "Removed from your played list.");
  }

  async function onWishlistToggle() {
    setWishlistPending(true);
    setStatus(null);
    const result = await setCourseWishlisted(courseId, !wishlisted);
    setWishlistPending(false);

    if (!result.ok) {
      setStatus(result.message ?? "We could not update your wish list.");
      return;
    }

    setWishlisted(!wishlisted);
    setStatus(!wishlisted ? "Added to your wish list." : "Removed from your wish list.");
  }

  if (!viewerSignedIn) {
    return (
      <Link href={`/sign-in?next=${encodeURIComponent(`/courses/${courseId}`)}`} className="solid-button min-h-11 justify-center">
        Sign in to save
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
      {!viewerNeedsOnboarding && !played ? (
        wishlistPending ? (
          <button type="button" disabled className="ghost-button min-h-11 justify-center">
            Saving...
          </button>
        ) : (
          <WantToPlayButton
            saved={wishlisted}
            onClick={onWishlistToggle}
            className="min-h-11 justify-center"
            labelOn="On your list"
            labelOff="Want to play"
          />
        )
      ) : null}
      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
    </div>
  );
}
