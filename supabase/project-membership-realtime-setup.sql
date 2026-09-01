-- One-time infra setup — run manually in the Supabase Dashboard → SQL Editor.
-- Not a Sequelize migration, same reasoning as chat-realtime-setup.sql /
-- notifications-realtime-setup.sql: this touches Supabase's own `realtime`
-- schema, which the app's regular DB role should not be altering as part of
-- normal deploys.
--
-- Prerequisites:
--   1. Clerk third-party auth already connected to this Supabase project
--      (same connection chat/notifications reuse).
--   2. Migration 20260901120000-add-status-to-private-project-members.js
--      already run — this depends on the "status" column existing.
--
-- Topic scheme: project-membership:{workspaceId}:{projectId}
-- Broadcasts on INSERT (a brand new member added) and UPDATE (status flipped
-- active <-> removed) of PrivateProjectMembers.

-- PrivateProjectMembers doesn't itself carry workspaceId, so the topic's
-- workspace segment is resolved via a join to Projects on every broadcast.
create or replace function public.broadcast_project_membership_change()
returns trigger
language plpgsql
security definer
as $$
declare
  v_workspace_id text;
  v_topic text;
begin
  select p."workspaceId"::text into v_workspace_id
  from public."Projects" p
  where p.id = new."projectId";

  if v_workspace_id is null then
    return new;
  end if;

  v_topic := 'project-membership:' || v_workspace_id || ':' || new."projectId"::text;

  perform realtime.send(
    jsonb_build_object('userId', new."userId", 'status', new.status),
    'member_changed',
    v_topic,
    true -- private channel
  );
  return new;
end;
$$;

drop trigger if exists private_project_members_broadcast on public."PrivateProjectMembers";

create trigger private_project_members_broadcast
after insert or update on public."PrivateProjectMembers"
for each row execute function public.broadcast_project_membership_change();

-- ─── Gate subscription: any active workspace member can watch a project's
-- membership topic (badges need to update for every viewer, not just admins;
-- the payload itself carries no sensitive data beyond a userId/status pair
-- already visible via GET /project/:id/members to any member) ────────────────
-- No `alter table realtime.messages enable row level security;` here — same
-- reasoning as notifications-realtime-setup.sql: current Supabase projects
-- ship with RLS already ON for that table, and the SQL Editor's role
-- typically doesn't own it, so re-running that ALTER fails with "must be
-- owner of table messages" (error 42501/45201) before it ever reaches the
-- policy below. If CREATE POLICY itself hits that error, see the
-- troubleshooting note at the bottom of notifications-realtime-setup.sql.
drop policy if exists "workspace members can read project membership changes" on realtime.messages;

create policy "workspace members can read project membership changes"
on realtime.messages
for select
to authenticated
using (
  split_part(realtime.topic(), ':', 1) = 'project-membership'
  and exists (
    select 1
    from public."workspaceMembers" wm
    where wm."userId" = (auth.jwt() ->> 'sub')
      and wm.status = true
      and wm."workspaceId"::text = split_part(realtime.topic(), ':', 2)
  )
);

-- ─── Required companion fix to chat's existing policy ──────────────────────────
-- chat-realtime-setup.sql's private-project chat policy currently grants
-- access on PrivateProjectMembers row *existence* alone. Now that "status"
-- exists, a removed member would still pass this check and keep live chat
-- access to a project they were removed from — re-create the same policy
-- with one added clause (mirrors how notifications-realtime-setup.sql itself
-- patched this policy once before, see its section 3).
drop policy if exists "workspace/project chat access" on realtime.messages;

create policy "workspace/project chat access"
on realtime.messages
for select
to authenticated
using (
  split_part(realtime.topic(), ':', 1) = 'workspace-chat'
  and exists (
    select 1
    from public."workspaceMembers" wm
    where wm."userId" = (auth.jwt() ->> 'sub')
      and wm.status = true
      and wm."workspaceId"::text = split_part(realtime.topic(), ':', 2)
  )
  and (
    split_part(realtime.topic(), ':', 3) = 'general'
    or exists (
      select 1
      from public."Projects" p
      where p.id::text = split_part(realtime.topic(), ':', 3)
        and p."workspaceId"::text = split_part(realtime.topic(), ':', 2)
        and (
          p.type = 'public'
          or exists (
            select 1
            from public."PrivateProjectMembers" ppm
            join public.users u on u.id = ppm."userId"
            where ppm."projectId" = p.id
              and ppm.status = 'active'
              and u."clerkId" = (auth.jwt() ->> 'sub')
          )
        )
    )
  )
);
