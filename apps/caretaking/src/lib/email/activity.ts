import { getSiteUrl } from "@/lib/supabase/env";

type SendActivityEmailParams = {
  to: string;
  subject: string;
  heading: string;
  lines: string[];
  ctaUrl: string;
  ctaLabel?: string;
  idempotencyKey: string;
};

export type SendActivityEmailResult = {
  provider: "resend";
  providerMessageId: string | null;
};

export async function sendActivityEmail(params: SendActivityEmailParams): Promise<SendActivityEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO;

  if (!apiKey || !from) {
    throw new Error("Activity email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const appUrl = getSiteUrl();
  const escapedLines = params.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");

  const html = `
    <div style="font-family: Georgia, serif; line-height: 1.6; color: #1f1a14;">
      <h1 style="font-size: 24px; margin-bottom: 12px;">${escapeHtml(params.heading)}</h1>
      ${escapedLines}
      <p style="margin: 24px 0;">
        <a href="${params.ctaUrl}" style="background: #1f7a6d; color: #fffdf9; padding: 12px 18px; border-radius: 999px; text-decoration: none;">
          ${escapeHtml(params.ctaLabel ?? "Open Caretaking App")}
        </a>
      </p>
      <p>If the button does not work, open this link:</p>
      <p><a href="${params.ctaUrl}">${params.ctaUrl}</a></p>
      <p style="color: #6d6256; font-size: 14px;">You received this because email notifications are enabled for this care space.</p>
      <p style="color: #6d6256; font-size: 14px;">Sent by Caretaking App from ${appUrl}</p>
    </div>
  `;

  const text = [params.heading, "", ...params.lines, "", `${params.ctaLabel ?? "Open Caretaking App"}: ${params.ctaUrl}`].join(
    "\n"
  );

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": params.idempotencyKey
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      reply_to: replyTo || undefined,
      subject: params.subject,
      html,
      text
    })
  });

  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Activity email delivery failed.");
  }

  return {
    provider: "resend",
    providerMessageId: payload?.id ?? null
  };
}

export function buildEmailSubject(spaceName: string, summary: string) {
  return `[${spaceName}]: ${summary}`.slice(0, 140);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
