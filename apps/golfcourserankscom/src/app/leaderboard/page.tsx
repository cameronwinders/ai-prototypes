import { redirect } from "next/navigation";

export default async function LeaderboardRedirect({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  const resolved = await searchParams;

  for (const [key, value] of Object.entries(resolved)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string") {
          params.append(key, entry);
        }
      }
    } else if (typeof value === "string") {
      params.set(key, value);
    }
  }

  redirect(params.size ? `/rankings?${params.toString()}` : "/rankings");
}
