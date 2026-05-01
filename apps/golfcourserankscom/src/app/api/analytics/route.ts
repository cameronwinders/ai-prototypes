import { NextResponse } from "next/server";

import { logAnalyticsEvent } from "@/lib/data";
import { getViewerContext } from "@/lib/viewer";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventName?: string;
      payload?: Record<string, unknown>;
    };
    const viewer = await getViewerContext();

    if (!body.eventName) {
      return NextResponse.json({ ok: false, message: "Missing event name." }, { status: 400 });
    }

    await logAnalyticsEvent({
      userId: viewer.user?.id ?? null,
      eventName: body.eventName as never,
      payload: body.payload ?? {}
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
