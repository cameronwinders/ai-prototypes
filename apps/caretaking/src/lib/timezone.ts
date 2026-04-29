export const DEFAULT_TIMEZONE = "America/Chicago";
export const TIMEZONE_COOKIE_NAME = "caretaking-timezone";

export function parseTimezone(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    Intl.DateTimeFormat("en-US", { timeZone: trimmed }).format(new Date());
    return trimmed;
  } catch {
    return null;
  }
}

export function resolveTimezone(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const parsed = parseTimezone(candidate);

    if (parsed) {
      return parsed;
    }
  }

  return DEFAULT_TIMEZONE;
}

export function isUtcTimezone(value?: string | null) {
  const parsed = parseTimezone(value);

  return parsed === "UTC" || parsed === "Etc/UTC";
}

export function shouldRefreshTimezone(current?: string | null, detected?: string | null) {
  const parsedDetected = parseTimezone(detected);

  if (!parsedDetected) {
    return false;
  }

  const parsedCurrent = parseTimezone(current);

  return !parsedCurrent || isUtcTimezone(parsedCurrent);
}
