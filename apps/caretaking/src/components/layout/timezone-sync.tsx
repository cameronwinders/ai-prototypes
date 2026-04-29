"use client";

import { useEffect } from "react";

import { TIMEZONE_COOKIE_NAME, parseTimezone } from "@/lib/timezone";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function TimezoneSync() {
  useEffect(() => {
    const browserTimezone = parseTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    if (!browserTimezone) {
      return;
    }

    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${TIMEZONE_COOKIE_NAME}=${encodeURIComponent(browserTimezone)}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax${secure}`;
  }, []);

  return null;
}
