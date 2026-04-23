"use server";

import { redirect } from "next/navigation";

import { acceptInviteForUser } from "@/lib/domain/invites";
import { requireUser } from "@/lib/auth/guards";
import { acceptInviteSchema } from "@/lib/validation/invites";

export async function acceptInvite(formData: FormData) {
  const parsed = acceptInviteSchema.safeParse({
    token: String(formData.get("token") ?? "")
  });

  if (!parsed.success) {
    redirect(`/accept-invite?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid invite token.")}`);
  }

  let redirectTo: string;

  try {
    const { supabase } = await requireUser();

    const result = await acceptInviteForUser({
      client: supabase,
      token: parsed.data.token
    });

    redirectTo = `/spaces/${result.spaceId}/timeline?success=${encodeURIComponent("Invite accepted.")}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to accept invite.";
    redirectTo = `/accept-invite?token=${encodeURIComponent(parsed.data.token)}&error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}
