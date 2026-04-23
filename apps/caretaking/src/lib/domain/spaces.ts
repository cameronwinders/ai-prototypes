import { firstRelation, type AppSupabaseClient } from "@/lib/domain/shared";

export async function createSpaceWithDefaults(params: {
  client: AppSupabaseClient;
  name: string;
  subjectName?: string;
}) {
  const { data: spaceId, error } = await params.client.rpc("create_space_mvp", {
    p_name: params.name,
    p_subject_name: params.subjectName || null
  });

  if (error || !spaceId) {
    throw new Error(error?.message ?? "Unable to create space.");
  }

  return { id: spaceId, name: params.name };
}

export async function listUserSpaces(client: AppSupabaseClient, userId: string) {
  const { data, error } = await client
    .from("space_memberships")
    .select("space_id, spaces(id, name, slug)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return data
    .map((row) => firstRelation(row.spaces))
    .filter((space): space is { id: string; name: string; slug: string | null } => Boolean(space));
}

export async function getSpaceDashboardData(client: AppSupabaseClient, spaceId: string) {
  const [{ data: space, error: spaceError }, { data: subjects, error: subjectsError }, { data: eventTypes, error: eventTypesError }, { data: memberships, error: membershipsError }, { data: invites, error: invitesError }] =
    await Promise.all([
      client.from("spaces").select("id, name").eq("id", spaceId).single(),
      client.from("subjects").select("id, name, is_primary").eq("space_id", spaceId).eq("status", "active").order("is_primary", { ascending: false }),
      client.from("event_types").select("id, key, name, icon, color").eq("space_id", spaceId).eq("is_active", true).order("sort_order"),
      client
        .from("space_memberships")
        .select("id, user_id, status, profiles(id, display_name, preferred_name, relationship_label), roles(key, name)")
        .eq("space_id", spaceId)
        .eq("status", "active"),
      client
        .from("space_invites")
        .select("id, email, status, expires_at, roles(key, name)")
        .eq("space_id", spaceId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    ]);

  if (spaceError || !space) {
    throw new Error(spaceError?.message ?? "Unable to load space.");
  }

  if (subjectsError || eventTypesError || membershipsError || invitesError) {
    throw new Error(
      subjectsError?.message ??
        eventTypesError?.message ??
        membershipsError?.message ??
        invitesError?.message ??
        "Unable to load dashboard data."
    );
  }

  return {
    space,
    subjects: subjects ?? [],
    eventTypes: eventTypes ?? [],
    memberships: (memberships ?? []).map((member) => ({
      ...member,
      profiles: firstRelation(member.profiles),
      roles: firstRelation(member.roles)
    })),
    invites: (invites ?? []).map((invite) => ({
      ...invite,
      roles: firstRelation(invite.roles)
    }))
  };
}
