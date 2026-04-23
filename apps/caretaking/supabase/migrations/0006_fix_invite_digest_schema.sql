create extension if not exists pgcrypto with schema extensions;

create or replace function public.accept_invite_mvp(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_invite public.space_invites%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if trim(coalesce(v_email, '')) = '' then
    raise exception 'Signed-in account must have an email';
  end if;

  select *
  into v_invite
  from public.space_invites
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invite is no longer active';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'Invite has expired';
  end if;

  if lower(v_invite.email) <> v_email then
    raise exception 'Signed-in email does not match the invite';
  end if;

  insert into public.space_memberships (space_id, user_id, role_id, status, joined_at)
  values (v_invite.space_id, v_user_id, v_invite.role_id, 'active', now())
  on conflict (space_id, user_id) do update
  set
    role_id = excluded.role_id,
    status = 'active',
    updated_at = now();

  update public.space_invites
  set
    status = 'accepted',
    accepted_by = v_user_id,
    accepted_at = now()
  where id = v_invite.id;

  insert into public.audit_logs (
    space_id,
    actor_user_id,
    entity_type,
    entity_id,
    action,
    changes,
    context
  )
  values (
    v_invite.space_id,
    v_user_id,
    'invite',
    v_invite.id,
    'accepted',
    jsonb_build_object('accepted_by', v_user_id),
    '{}'::jsonb
  );

  return v_invite.space_id;
end;
$$;

revoke all on function public.accept_invite_mvp(text) from public;
grant execute on function public.accept_invite_mvp(text) to authenticated;
