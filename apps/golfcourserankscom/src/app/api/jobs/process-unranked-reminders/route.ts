import { NextRequest, NextResponse } from "next/server";

import { runUnrankedReminderSweep } from "@/app/actions";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim() || process.env.APP_CRON_SECRET?.trim();

  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runUnrankedReminderSweep();
    return NextResponse.json({ ok: true, ...result });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Reminder sweep failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
