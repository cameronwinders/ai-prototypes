import "server-only";

import {
  getUnrankedReminderCandidates,
  recordEmailNotification
} from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Golf Course Ranks <hello@golfcourseranks.com>";
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || undefined;

  if (!apiKey) {
    throw new Error("Email delivery is not configured.");
  }

  return { apiKey, from, replyTo };
}

async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const { apiKey, from, replyTo } = getEmailConfig();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      reply_to: replyTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email delivery failed: ${detail}`);
  }
}

function personName(name?: string | null, fallback = "there") {
  return name?.trim() || fallback;
}

function normalizeNextPath(input: string) {
  if (input.startsWith("/")) {
    return input;
  }

  try {
    const target = new URL(input);
    const site = new URL(getSiteUrl());

    if (target.origin === site.origin) {
      return `${target.pathname}${target.search}${target.hash}`;
    }
  } catch {
    // Fall back below.
  }

  return "/rankings";
}

async function createEmailSignInLink(email: string, next: string) {
  const admin = createAdminClient();
  const nextPath = normalizeNextPath(next);
  const generatedLink = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${getSiteUrl()}/api/auth/callback?next=${encodeURIComponent(nextPath)}`
    }
  });

  if (generatedLink.error) {
    throw new Error(generatedLink.error.message);
  }

  const hashedToken = generatedLink.data.properties?.hashed_token;
  const verificationType = generatedLink.data.properties?.verification_type;

  if (!hashedToken || !verificationType) {
    throw new Error("We could not create the secure sign-in link.");
  }

  return `${getSiteUrl()}/api/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=${encodeURIComponent(verificationType)}&next=${encodeURIComponent(nextPath)}`;
}

export async function sendAuthMagicLinkEmail(input: {
  to: string;
  subject: string;
  actionLink: string;
  mode: "sign-in" | "sign-up";
}) {
  const intro =
    input.mode === "sign-up"
      ? "Open the secure link below to confirm your Golf Course Ranks account and finish your handicap setup."
      : "Open the secure link below to sign in to Golf Course Ranks.";

  await sendEmail({
    to: input.to,
    subject: input.subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#14231d">
        <p>${intro}</p>
        <p><a href="${input.actionLink}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#162622;color:#ffffff;text-decoration:none;font-weight:600">Open Golf Course Ranks</a></p>
        <p style="font-size:14px;color:#5d6a64">If the button does not work, copy and paste this link into your browser:</p>
        <p style="font-size:14px;word-break:break-all;color:#5d6a64">${input.actionLink}</p>
      </div>
    `,
    text: `${intro}\n\n${input.actionLink}`
  });
}

export async function sendFriendRequestReceivedEmail(input: {
  to: string;
  recipientName: string;
  requesterName: string;
  requesterHandle: string;
}) {
  const friendsUrl = await createEmailSignInLink(input.to, "/friends");
  const requesterUrl = `${getSiteUrl()}/u/${encodeURIComponent(input.requesterHandle)}`;
  const requesterSignInUrl = await createEmailSignInLink(input.to, requesterUrl);

  await sendEmail({
    to: input.to,
    subject: `${input.requesterName} sent you a Golf Course Ranks request`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#14231d">
        <p>Hi ${personName(input.recipientName)},</p>
        <p><strong>${input.requesterName}</strong> wants to connect with you on Golf Course Ranks.</p>
        <p><a href="${friendsUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#162622;color:#ffffff;text-decoration:none;font-weight:600">Review request</a></p>
        <p style="font-size:14px;color:#5d6a64">You can also view their profile here:</p>
        <p><a href="${requesterSignInUrl}" style="font-size:14px;word-break:break-all;color:#5d6a64">${requesterUrl}</a></p>
      </div>
    `,
    text: `Hi ${personName(input.recipientName)},\n\n${input.requesterName} wants to connect with you on Golf Course Ranks.\n\nReview request: ${friendsUrl}\nView their profile: ${requesterSignInUrl}`
  });
}

export async function sendFriendRequestAcceptedEmail(input: {
  to: string;
  requesterName: string;
  accepterName: string;
  compareUrl: string;
  profileUrl: string;
  friendshipId: string;
  requesterUserId: string;
  accepterUserId: string;
}) {
  const inserted = await recordEmailNotification({
    recipientUserId: input.requesterUserId,
    actorUserId: input.accepterUserId,
    notificationType: "friend-request-accepted",
    dedupeKey: `friend-request-accepted:${input.friendshipId}`,
    payload: {
      accepter_name: input.accepterName,
      compare_url: input.compareUrl
    }
  });

  if (!inserted) {
    return false;
  }

  const compareSignInUrl = await createEmailSignInLink(input.to, input.compareUrl);
  const profileSignInUrl = await createEmailSignInLink(input.to, input.profileUrl);

  await sendEmail({
    to: input.to,
    subject: `${input.accepterName} accepted your Golf Course Ranks request`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#14231d">
        <p>Hi ${personName(input.requesterName)},</p>
        <p><strong>${input.accepterName}</strong> accepted your request on Golf Course Ranks.</p>
        <p><a href="${compareSignInUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#162622;color:#ffffff;text-decoration:none;font-weight:600">Compare lists</a></p>
        <p style="font-size:14px;color:#5d6a64">You can also view their profile here:</p>
        <p><a href="${profileSignInUrl}" style="font-size:14px;word-break:break-all;color:#5d6a64">${input.profileUrl}</a></p>
      </div>
    `,
    text: `Hi ${personName(input.requesterName)},\n\n${input.accepterName} accepted your request on Golf Course Ranks.\n\nCompare lists: ${compareSignInUrl}\nView profile: ${profileSignInUrl}`
  });

  return true;
}

export async function sendInviteConversionEmail(input: {
  to: string;
  inviterName: string;
  inviterUserId: string;
  inviterHandle: string;
  joinerName: string;
  joinerUserId: string;
  joinerHandle: string;
}) {
  const inserted = await recordEmailNotification({
    recipientUserId: input.inviterUserId,
    actorUserId: input.joinerUserId,
    notificationType: "invite-conversion",
    dedupeKey: `invite-conversion:${input.inviterUserId}:${input.joinerUserId}`,
    payload: {
      joiner_name: input.joinerName,
      joiner_handle: input.joinerHandle
    }
  });

  if (!inserted) {
    return false;
  }

  const friendsUrl = await createEmailSignInLink(input.to, "/friends?utm_source=email&utm_medium=lifecycle&utm_campaign=invite_conversion");
  const joinerProfileUrl = `${getSiteUrl()}/u/${encodeURIComponent(input.joinerHandle)}?utm_source=email&utm_medium=lifecycle&utm_campaign=invite_conversion`;
  const joinerProfileSignInUrl = await createEmailSignInLink(input.to, joinerProfileUrl);

  await sendEmail({
    to: input.to,
    subject: `${input.joinerName} joined from your invite`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#14231d">
        <p>Hi ${personName(input.inviterName)},</p>
        <p><strong>${input.joinerName}</strong> joined Golf Course Ranks through your invite link.</p>
        <p><a href="${friendsUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#162622;color:#ffffff;text-decoration:none;font-weight:600">See your new friend</a></p>
        <p style="font-size:14px;color:#5d6a64">Their profile is ready here:</p>
        <p><a href="${joinerProfileSignInUrl}" style="font-size:14px;word-break:break-all;color:#5d6a64">${joinerProfileUrl}</a></p>
      </div>
    `,
    text: `Hi ${personName(input.inviterName)},\n\n${input.joinerName} joined Golf Course Ranks through your invite link.\n\nSee your new friend: ${friendsUrl}\nView profile: ${joinerProfileSignInUrl}`
  });

  return true;
}

export async function processUnrankedReminderEmails() {
  const candidates = await getUnrankedReminderCandidates();
  let sentCount = 0;

  for (const candidate of candidates) {
    if (!candidate.profile.email) {
      continue;
    }

    const nextOrdinal = candidate.reminderCount + 1;
    const inserted = await recordEmailNotification({
      recipientUserId: candidate.profile.id,
      notificationType: "unranked-reminder",
      dedupeKey: `unranked-reminder:${candidate.profile.id}:${nextOrdinal}`,
      payload: {
        played_count: candidate.playedCount,
        ranked_count: candidate.rankedCount,
        sample_courses: candidate.sampleCourses
      }
    });

    if (!inserted) {
      continue;
    }

    const coursesLine =
      candidate.sampleCourses.length > 0
        ? `You already marked ${candidate.sampleCourses.join(", ")}${candidate.sampleCourses.length >= 3 ? ", and more" : ""} as played.`
        : `You already marked ${candidate.playedCount} courses as played.`;
    const actionUrl = await createEmailSignInLink(
      candidate.profile.email,
      "/me/courses?utm_source=email&utm_medium=lifecycle&utm_campaign=unranked_reminder"
    );

    await sendEmail({
      to: candidate.profile.email,
      subject: "You've got courses waiting to be ranked",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#14231d">
          <p>Hi ${personName(candidate.profile.display_name, candidate.profile.handle)},</p>
          <p>${coursesLine}</p>
          <p>Now rank the ones you would book again first. It only takes a minute to get your list started.</p>
          <p><a href="${actionUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#162622;color:#ffffff;text-decoration:none;font-weight:600">Finish ranking</a></p>
        </div>
      `,
      text: `Hi ${personName(candidate.profile.display_name, candidate.profile.handle)},\n\n${coursesLine}\nNow rank the ones you would book again first. It only takes a minute to get your list started.\n\nFinish ranking: ${actionUrl}`
    });

    sentCount += 1;
  }

  return {
    candidates: candidates.length,
    sent: sentCount
  };
}
