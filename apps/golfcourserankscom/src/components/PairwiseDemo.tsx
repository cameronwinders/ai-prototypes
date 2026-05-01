"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatLocation } from "@/lib/ranking";

type DemoCourse = {
  name: string;
  city: string;
  state: string;
};

const pairings: Array<[DemoCourse, DemoCourse]> = [
  [
    { name: "Pebble Beach Golf Links", city: "Pebble Beach", state: "CA" },
    { name: "Pinehurst No 2", city: "Pinehurst", state: "NC" }
  ],
  [
    { name: "Pacific Dunes", city: "Bandon", state: "OR" },
    { name: "Bandon Dunes", city: "Bandon", state: "OR" }
  ],
  [
    { name: "Whistling Straits", city: "Sheboygan", state: "WI" },
    { name: "Kiawah Island Ocean", city: "Kiawah Island", state: "SC" }
  ]
];

export function PairwiseDemo() {
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<DemoCourse[]>([]);
  const finished = step >= pairings.length;

  const orderedChoices = useMemo(
    () =>
      choices.map((course, index) => ({
        ...course,
        rank: index + 1
      })),
    [choices]
  );

  function chooseCourse(course: DemoCourse) {
    if (finished) {
      return;
    }

    setChoices((current) => [...current, course]);
    setStep((current) => current + 1);

    if (step === pairings.length - 1) {
      void fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          eventName: "pairwise_demo_completed",
          payload: {
            winner: course.name
          }
        })
      });
    }
  }

  return (
    <section className="shell-panel rounded-[2rem] p-6">
      <p className="section-label">Try it</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
        Which would you rather play?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        This is the same pairwise idea that powers the leaderboard, just compressed into a fast demo.
      </p>

      {finished ? (
        <div className="mt-6 rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">Your quick stack</p>
          <div className="mt-4 grid gap-3">
            {orderedChoices.map((course) => (
              <div key={`${course.rank}-${course.name}`} className="rounded-[1.3rem] border border-[var(--line)] px-4 py-4">
                <p className="text-sm text-[var(--muted)]">{course.rank})</p>
                <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{course.name}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Sign up to save them and build your full public-course stack.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/sign-in?next=/me/courses" className="solid-button min-h-11">
              Start ranking for real
            </Link>
            <button
              type="button"
              onClick={() => {
                setChoices([]);
                setStep(0);
              }}
              className="ghost-button min-h-11"
            >
              Run it again
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {pairings[step].map((course) => (
            <button
              key={`${step}-${course.name}`}
              type="button"
              onClick={() => chooseCourse(course)}
              className="rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-5 text-left transition hover:bg-white"
            >
              <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">
                Tap to choose
              </span>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{course.name}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
