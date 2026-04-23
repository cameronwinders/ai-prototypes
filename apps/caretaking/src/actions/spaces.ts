"use server";

import { redirect } from "next/navigation";

import { createSpaceWithDefaults } from "@/lib/domain/spaces";
import { requireUser } from "@/lib/auth/guards";
import { createSpaceSchema, inviteMemberSchema } from "@/lib/validation/spaces";
import { inviteMemberToSpace } from "@/lib/domain/invites";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createSpace(formData: FormData) {
  const parsed = createSpaceSchema.safeParse({
    name: getString(formData, "name"),
    subjectName: getString(formData, "subjectName")
  });

  if (!parsed.success) {
    redirect(`/spaces/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid space data.")}`);
  }

  let redirectTo: string;

  try {
    const { supabase } = await requireUser();
    const space = await createSpaceWithDefaults({
      client: supabase,
      name: parsed.data.name,
      subjectName: parsed.data.subjectName || undefined
    });

    redirectTo = `/spaces/${space.id}/timeline`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create space.";
    redirectTo = `/spaces/new?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}

export async function inviteMember(formData: FormData) {
  const parsed = inviteMemberSchema.safeParse({
    spaceId: getString(formData, "spaceId"),
    email: getString(formData, "email"),
    roleKey: getString(formData, "roleKey")
  });

  if (!parsed.success) {
    redirect(`/?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid invite data.")}`);
  }

  let redirectTo: string;

  try {
    const { supabase, user } = await requireUser();
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
    const { data: space } = await supabase.from("spaces").select("name").eq("id", parsed.data.spaceId).single();
    const { data: primarySubject } = await supabase
      .from("subjects")
      .select("name")
      .eq("space_id", parsed.data.spaceId)
      .eq("status", "active")
      .eq("is_primary", true)
      .maybeSingle();
    const { data: roleResult, error: roleError } = await supabase.rpc("space_role", {
      target_space_id: parsed.data.spaceId
    });

    if (roleError) {
      throw new Error(roleError.message);
    }

    const result = await inviteMemberToSpace({
      client: supabase,
      inviterRole: roleResult,
      inviterName: profile?.display_name ?? "A caregiver",
      spaceName: space?.name ?? "your shared space",
      subjectName: primarySubject?.name ?? null,
      spaceId: parsed.data.spaceId,
      email: parsed.data.email,
      roleKey: parsed.data.roleKey
    });

    redirectTo = `/spaces/${parsed.data.spaceId}/timeline?success=${encodeURIComponent(`Invite emailed to ${result.invite.email}.`)}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create invite.";
    redirectTo = `/spaces/${parsed.data.spaceId}/timeline?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}
