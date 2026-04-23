"use server";

import { requireUser } from "@/lib/auth/guards";
import { listTimelineItems } from "@/lib/domain/events";

export async function listTimeline(spaceId: string) {
  const { supabase } = await requireUser();
  return listTimelineItems({
    client: supabase,
    spaceId
  });
}
