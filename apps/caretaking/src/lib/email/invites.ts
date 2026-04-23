import { getSiteUrl } from "@/lib/supabase/env";

type SendInviteEmailParams = {
  to: string;
  inviterName: string;
  spaceName: string;
  inviteUrl: string;
  subjectName?: string | null;
  idempotencyKey: string;
};

type SendInviteEmailResult = {
  provider: "resend";
  providerMessageId: string | null;
};

export async function sendInviteEmail(params: SendInviteEmailParams): Promise<SendInviteEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO;

  if (!apiKey || !from) {
    throw new Error("Invite email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const appUrl = getSiteUrl();
  const introTarget = params.subjectName
    ? `for ${escapeHtml(params.subjectName)}`
    : "for the shared caregiving space";

  const html = `
    <div style="font-family: Georgia, serif; line-height: 1.6; color: #1f1a14;">
      <h1 style="font-size: 24px; margin-bottom: 12px;">You have been invited to Caretaking App</h1>
      <p>${escapeHtml(params.inviterName)} invited you to collaborate in <strong>${escapeHtml(
        params.spaceName
      )}</strong> ${introTarget}.</p>
      <p>This app is intentionally generic, so the shared space can support many caregiving workflows over time.</p>
      <p style="margin: 24px 0;">
        <a href="${params.inviteUrl}" style="background: #1f7a6d; color: #fffdf9; padding: 12px 18px; border-radius: 999px; text-decoration: none;">
          Accept invite
        </a>
      </p>
      <p>If the button does not work, open this link:</p>
      <p><a href="${params.inviteUrl}">${params.inviteUrl}</a></p>
      <p style="color: #6d6256; font-size: 14px;">If you did not expect this invitation, you can safely ignore it.</p>
      <p style="color: #6d6256; font-size: 14px;">Sent by Caretaking App from ${appUrl}</p>
    </div>
  `;

  const text = [
    "You have been invited to Caretaking App",
    "",
    `${params.inviterName} invited you to collaborate in ${params.spaceName}.`,
    params.subjectName ? `Subject: ${params.subjectName}` : null,
    "",
    `Accept invite: ${params.inviteUrl}`,
    "",
    "If you did not expect this invitation, you can safely ignore it."
  ]
    .filter(Boolean)
    .join("\n");

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
      subject: `Invitation to join ${params.spaceName}`,
      html,
      text
    })
  });

  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Invite email delivery failed.");
  }

  return {
    provider: "resend",
    providerMessageId: payload?.id ?? null
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
