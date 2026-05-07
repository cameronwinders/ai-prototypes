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
    <section className="shell-panel shell-panel-contrast p-6 md:p-7">
      <h2 className="h2 text-[1.75rem] text-ink">Which would you rather play?</h2>

      {finished ? (
        <div className="mt-5 rounded-lg border border-line bg-white/92 p-5">
          <p className="eyebrow">Your quick stack</p>
          <div className="mt-4 grid gap-3">
            {orderedChoices.map((course) => (
              <div key={`${course.rank}-${course.name}`} className="rounded-md border border-line px-4 py-4">
                <p className="meta">{course.rank})</p>
                <p className="mt-1 text-lg font-semibold text-ink">{course.name}</p>
                <p className="meta mt-1">{formatLocation(course)}</p>
              </div>
            ))}
          </div>
          <p className="meta mt-4 leading-6">
            Sign up to save them and build your full public-course stack.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/sign-in?next=/me/courses" className="solid-button justify-center">
              Start ranking for real
            </Link>
            <button
              type="button"
              onClick={() => {
                setChoices([]);
                setStep(0);
              }}
              className="ghost-button justify-center"
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
              className="min-h-[11.25rem] rounded-lg border border-line bg-white/92 p-5 text-left transition-[background-color,transform] duration-150 hover:-translate-y-px hover:bg-white"
            >
              <span className="pill pill-pine">Tap to choose</span>
              <h3 className="mt-4 text-[1.4rem] font-semibold tracking-[var(--tracking-tight)] text-ink">{course.name}</h3>
              <p className="meta mt-2">{formatLocation(course)}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
