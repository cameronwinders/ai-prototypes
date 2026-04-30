"use client";

import { resolveTimezone } from "@/lib/timezone";

type LocalTimeProps = {
  value: string;
  timezone?: string;
};

export function LocalTime({ value, timezone }: LocalTimeProps) {
  return (
    <>
      {new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: resolveTimezone(timezone)
      }).format(new Date(value))}
    </>
  );
}
