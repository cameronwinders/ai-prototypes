import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

async function processReminderJob(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.APP_CRON_SECRET;
  const authorization = request.headers.get("authorization");
  const provided = request.headers.get("x-cron-secret") ?? authorization?.replace(/^Bearer\s+/i, "");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("process_due_reminders_mvp", {
    p_limit: 50
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ processed: data ?? 0 });
}

export async function GET(request: Request) {
  return processReminderJob(request);
}

export async function POST(request: Request) {
  return processReminderJob(request);
}
