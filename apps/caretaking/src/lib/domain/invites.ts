import { randomBytes } from "node:crypto";

import { sendInviteEmail } from "@/lib/email/invites";
import { getSiteUrl } from "@/lib/supabase/env";
import { hashInviteToken, normalizeEmail, type AppSupabaseClient } from "@/lib/domain/shared";

export async function inviteMemberToSpace(params: {
  client: AppSupabaseClient;
  inviterRole: string | null;
  inviterName: string;
  spaceName: string;
  subjectName?: string | null;
  spaceId: string;
  email: string;
  roleKey: "caregiver" | "viewer";
}) {
  if (params.inviterRole !== "owner") {
    throw new Error("Only owners can invite members in MVP.");
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error("Invite email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const normalizedEmail = normalizeEmail(params.email);
  const rawToken = randomBytes(24).toString("hex");
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  const inviteUrl = `${getSiteUrl()}/accept-invite?token=${rawToken}`;

  const { data, error } = await params.client.rpc("create_invite_mvp", {
    p_space_id: params.spaceId,
    p_email: normalizedEmail,
    p_role_key: params.roleKey,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt
  });

  const invite = data?.[0];

  if (error || !invite) {
    throw new Error(error?.message ?? "Unable to create invite.");
  }

  try {
    const delivery = await sendInviteEmail({
      to: normalizedEmail,
      inviterName: params.inviterName,
      spaceName: params.spaceName,
      inviteUrl,
      subjectName: params.subjectName ?? null,
      idempotencyKey: invite.invite_id
    });

    const { error: deliveryLogError } = await params.client.rpc("record_invite_delivery_mvp", {
      p_invite_id: invite.invite_id,
      p_provider: delivery.provider,
      p_provider_message_id: delivery.providerMessageId,
      p_status: "sent",
      p_metadata: { delivery: "email" }
    });

    if (deliveryLogError) {
      throw new Error(deliveryLogError.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invite email delivery failed.";

    const { error: failedDeliveryLogError } = await params.client.rpc("record_invite_delivery_mvp", {
      p_invite_id: invite.invite_id,
      p_provider: "resend",
      p_provider_message_id: null,
      p_status: "failed",
      p_error_message: message,
      p_metadata: { delivery: "email" }
    });

    if (failedDeliveryLogError) {
      throw new Error(`${message} Delivery logging also failed: ${failedDeliveryLogError.message}`);
    }

    throw new Error(`${message} The invite is still pending and can be retried later.`);
  }

  return {
    invite: {
      id: invite.invite_id,
      email: invite.email,
      expires_at: invite.expires_at
    }
  };
}

export async function acceptInviteForUser(params: {
  client: AppSupabaseClient;
  token: string;
}) {
  const { data: spaceId, error } = await params.client.rpc("accept_invite_mvp", {
    p_token: params.token
  });

  if (error || !spaceId) {
    throw new Error(error?.message ?? "Unable to accept invite.");
  }

  return { spaceId };
}
