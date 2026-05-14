"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { saveWishlistOrder, setCoursePlayed, setCourseWishlisted } from "@/app/actions";
import { WantToPlayButton } from "@/components/PlayActions";
import { ShareButton } from "@/components/ShareButton";
import { formatLocation } from "@/lib/ranking";
import type { WishlistCourse } from "@/lib/types";

type WishlistManagerProps = {
  initialCourses: WishlistCourse[];
  siteUrl: string;
  viewerHandle: string;
  inviteUrl: string;
};

function mergeWishlistOrder(current: WishlistCourse[], orderedIds: string[]) {
  const orderById = new Map(orderedIds.map((id, index) => [id, index]));
  return [...current]
    .map((course) => ({
      ...course,
      rankPosition: orderById.get(course.id) ?? course.rankPosition
    }))
    .sort((left, right) => left.rankPosition - right.rankPosition);
}

export function WishlistManager({ initialCourses, siteUrl, viewerHandle, inviteUrl }: WishlistManagerProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const latestCourses = useRef(initialCourses);

  function syncCourses(next: WishlistCourse[]) {
    latestCourses.current = next;
    setCourses(next);
  }

  async function handleRemove(courseId: string) {
    setBusyCourseId(courseId);
    setStatus(null);
    const result = await setCourseWishlisted(courseId, false);
    setBusyCourseId(null);

    if (!result.ok) {
      setStatus(result.message ?? "We could not update that wish list spot.");
      return;
    }

    syncCourses(latestCourses.current.filter((course) => course.id !== courseId));
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

    syncCourses(latestCourses.current.filter((course) => course.id !== courseId));
    setStatus("Marked played and moved out of your wish list.");
  }

  async function handleReorder(nextIds: string[]) {
    const previous = latestCourses.current;
    const optimistic = mergeWishlistOrder(latestCourses.current, nextIds);
    syncCourses(optimistic);
    setStatus("Saving order...");
    const result = await saveWishlistOrder(nextIds);

    if (!result.ok || !result.data) {
      setStatus(result.message ?? "We could not save that wish list order.");
      syncCourses(previous);
      return;
    }

    syncCourses(result.data);
    setStatus("Saved.");
  }

  async function handleMove(courseId: string, direction: -1 | 1) {
    const currentIndex = latestCourses.current.findIndex((course) => course.id === courseId);
    const targetIndex = currentIndex + direction;

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= latestCourses.current.length) {
      return;
    }

    const next = [...latestCourses.current];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    await handleReorder(next.map((course) => course.id));
    setStatus(`${moved.name} moved to wish-list rank ${targetIndex + 1}.`);
  }

  async function handleMoveToTop(courseId: string) {
    const currentIndex = latestCourses.current.findIndex((course) => course.id === courseId);

    if (currentIndex <= 0) {
      return;
    }

    const next = [...latestCourses.current];
    const [moved] = next.splice(currentIndex, 1);
    next.unshift(moved);
    await handleReorder(next.map((course) => course.id));
    setStatus(`${moved.name} moved to wish-list rank 1.`);
  }

  return (
    <section className="shell-panel-soft p-6 sm:p-8">
      <div className="space-y-6">
        <header className="space-y-4">
          <p className="eyebrow">WISH LIST</p>
          <h1 className="h2">Keep future rounds in one ranked stack</h1>
          <p className="subhed">
            Save the public courses you still want to play, then order them by which trip you would book first.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="pill pill-pine pill-sentence">{courses.length} saved for later</span>
            <ShareButton
              title="Share my Golf Course wish list"
              text="These are the public courses I want to play next on Golf Course Ranks."
              url={`${siteUrl}/u/${viewerHandle}?view=wishlist&utm_source=share&utm_medium=wishlist&utm_campaign=user_share#wishlist`}
              className="ghost-button"
              analyticsSurface="wishlist-share"
              buttonChildren="Share my wish list"
            />
            <ShareButton
              title="Join me on Golf Course Ranks"
              text="Compare your public-course rankings and wish list with mine on Golf Course Ranks."
              url={inviteUrl}
              className="ghost-button"
              analyticsSurface="wishlist-invite"
              buttonChildren="Invite friends"
            />
            <Link href="/courses" className="ghost-button">
              Browse more courses
            </Link>
            <Link href="/me/courses" className="ghost-button">
              Open my courses
            </Link>
          </div>
        </header>

        {status ? <p className="meta">{status}</p> : null}

        {courses.length >= 5 ? (
          <section className="shell-panel-contrast p-5">
            <p className="eyebrow">SHARE YOUR NEXT TRIP</p>
            <h2 className="h3 mt-4">Your wish list is worth sending around</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              Share the public courses you want to play next, then invite a friend to build their own wish list so you can line up the trip together.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ShareButton
                title="Share my Golf Course wish list"
                text="These are the public courses I want to play next on Golf Course Ranks."
                url={`${siteUrl}/u/${viewerHandle}?view=wishlist&utm_source=share&utm_medium=wishlist&utm_campaign=user_share#wishlist`}
                className="solid-button"
                analyticsSurface="wishlist-share-prompt"
                buttonChildren="Share my wish list"
              />
              <ShareButton
                title="Join me on Golf Course Ranks"
                text="Compare your public-course rankings and wish list with mine on Golf Course Ranks."
                url={inviteUrl}
                className="ghost-button"
                analyticsSurface="wishlist-invite-prompt"
                buttonChildren="Invite friends"
              />
            </div>
          </section>
        ) : null}

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
          <section className="shell-panel-contrast p-6 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="eyebrow">RANK YOUR WISH LIST</p>
                <h2 className="h3 mt-4">Put your next-trip priorities in order</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  New courses are added to the bottom of this list. Use Top, Up, and Down to move the dream trip to the top.
                </p>
              </div>
              <span className="meta">{courses.length} courses on your list</span>
            </div>

            <div className="mt-6 grid gap-3">
              {courses.map((course) => (
                <div key={course.id} className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/92 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="pill pill-pine">#{course.rankPosition + 1}</span>
                        {course.leaderboard_rank ? <span className="pill pill-line">National rank #{course.leaderboard_rank}</span> : null}
                      </div>
                      <h2 className="h3 mt-4 text-[1.35rem]">{course.name}</h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                    </div>

                    <div className="grid gap-2 sm:flex sm:flex-wrap">
                      <button type="button" onClick={() => void handleMoveToTop(course.id)} className="ghost-button sm justify-center">
                        Top
                      </button>
                      <button type="button" onClick={() => void handleMove(course.id, -1)} className="ghost-button sm justify-center">
                        Up
                      </button>
                      <button type="button" onClick={() => void handleMove(course.id, 1)} className="ghost-button sm justify-center">
                        Down
                      </button>
                      <Link href={`/courses/${course.id}`} className="ghost-button sm justify-center">
                        View detail
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleMarkPlayed(course.id)}
                        disabled={busyCourseId === course.id}
                        className="solid-button sm justify-center"
                      >
                        {busyCourseId === course.id ? "Saving..." : "Mark played"}
                      </button>
                      <WantToPlayButton
                        saved
                        onClick={() => handleRemove(course.id)}
                        disabled={busyCourseId === course.id}
                        labelOn="On your list"
                        className="sm justify-center"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
