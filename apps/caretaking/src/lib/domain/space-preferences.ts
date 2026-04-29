type SpaceLike = {
  id: string;
};

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export const LAST_SPACE_COOKIE = "caretaking-last-space";

export function getLastSpaceId(cookieStore: CookieReader) {
  return cookieStore.get(LAST_SPACE_COOKIE)?.value ?? null;
}

export function resolvePreferredSpaceId<T extends SpaceLike>(spaces: T[], candidateSpaceId?: string | null) {
  if (!candidateSpaceId) {
    return spaces[0]?.id ?? null;
  }

  return spaces.some((space) => space.id === candidateSpaceId) ? candidateSpaceId : spaces[0]?.id ?? null;
}
