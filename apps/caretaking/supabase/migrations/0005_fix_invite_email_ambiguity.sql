create or replace function public.create_invite_mvp(
  p_space_id uuid,
  p_email text,
  p_role_key text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns table (invite_id uuid, email text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role_id uuid;
  v_invite_id uuid;
  v_invite_email text;
  v_invite_expires_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if public.space_role(p_space_id) <> 'owner' then
    raise exception 'Only owners can invite members';
  end if;

  if exists (
    select 1
    from public.space_invites si
    where si.space_id = p_space_id
      and lower(si.email) = lower(trim(p_email))
      and si.status = 'pending'
  ) then
    raise exception 'A pending invite already exists for this email';
  end if;

  select r.id into v_role_id
  from public.roles r
  where r.key = p_role_key;

  if v_role_id is null then
    raise exception 'Invalid role key';
  end if;

  insert into public.space_invites as si (
    space_id,
    email,
    role_id,
    invited_by,
    token_hash,
    expires_at
  )
  values (
    p_space_id,
    lower(trim(p_email)),
    v_role_id,
    v_user_id,
    p_token_hash,
    p_expires_at
  )
  returning si.id, si.email, si.expires_at
  into v_invite_id, v_invite_email, v_invite_expires_at;

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
    p_space_id,
    v_user_id,
    'invite',
    v_invite_id,
    'created',
    jsonb_build_object('role_key', p_role_key),
    '{}'::jsonb
  );

  invite_id := v_invite_id;
  email := v_invite_email;
  expires_at := v_invite_expires_at;

  return next;
end;
$$;

revoke all on function public.create_invite_mvp(uuid, text, text, text, timestamptz) from public;
grant execute on function public.create_invite_mvp(uuid, text, text, text, timestamptz) to authenticated;
