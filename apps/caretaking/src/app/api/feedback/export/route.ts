import { NextResponse } from "next/server";

import { isFeedbackReviewer } from "@/lib/auth/feedback-reviewers";
import { listFeedbackSubmissionsForReview } from "@/lib/domain/feedback";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !isFeedbackReviewer(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const admin = createAdminClient();
  const items = await listFeedbackSubmissionsForReview(admin, {
    status: status === "new" || status === "reviewing" || status === "planned" || status === "closed" ? status : "all",
    limit: 500
  });

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    count: items.length,
    items
  });
}
