-- One-time infra setup — run manually in the Supabase Dashboard → SQL Editor.
-- Not a Sequelize migration: it touches Supabase's own `realtime` schema,
-- which the app's regular DB role should not be altering as part of normal
-- deploys.
--
-- Prerequisites (see project chat notes):
--   1. Clerk third-party auth connected to this Supabase project, so that
--      auth.jwt() inside RLS reflects the Clerk session token's claims.
--   2. The `chatMessages` table already exists, including the projectId /
--      attachment columns added by
--      20260804140000-add-project-channel-and-attachment-to-chat-messages.js
--      — run that migration before this script.
--
-- Topic scheme: workspace-chat:{workspaceId}:{projectId|general}
-- ("general" for the workspace-wide channel, a numeric project id for that
-- project's channel) — this is a rewrite of the original single-channel
-- version (topic was just workspace-chat:{workspaceId}), safe to re-run.
--
-- Verify realtime.broadcast_changes()'s exact signature and realtime.topic()
-- against your project's current Supabase docs (Database → Realtime →
-- Broadcast from Database) before running — this API has changed across
-- Supabase releases.

-- ─── 1. Broadcast every new chat message to its channel's topic ───────────────
-- Uses realtime.send() (not broadcast_changes()) so the payload can carry the
-- joined author (username/imageUrl) plus projectId/attachment, matching the
-- shape the REST endpoint already returns — the frontend can use one
-- ChatMessage type for both.
create or replace function public.broadcast_chat_message()
returns trigger
language plpgsql
security definer
as $$
declare
  v_author jsonb;
  v_topic text;
begin
  select jsonb_build_object(
    'id', u.id,
    'username', u.username,
    'email', u.email,
    'imageUrl', u."imageUrl"
  )
  into v_author
  from public.users u
  where u.id = new."userId";

  v_topic := 'workspace-chat:' || new."workspaceId"::text || ':' ||
             coalesce(new."projectId"::text, 'general');

  perform realtime.send(
    jsonb_build_object(
      'id', new.id,
      'workspaceId', new."workspaceId",
      'projectId', new."projectId",
      'userId', new."userId",
      'content', new.content,
      'attachment', new.attachment,
      'editedAt', new."editedAt",
      'createdAt', new."createdAt",
      'updatedAt', new."updatedAt",
      'author', v_author
    ),
    'chat_message',   -- event
    v_topic,
    true              -- private channel
  );
  return new;
end;
$$;

drop trigger if exists chat_messages_broadcast on public."chatMessages";

create trigger chat_messages_broadcast
after insert on public."chatMessages"
for each row execute function public.broadcast_chat_message();

-- ─── 2. Gate subscription per channel ──────────────────────────────────────────
-- General (3rd topic segment = "general"): workspace membership, same as
-- before. A project channel (3rd segment = numeric project id): workspace
-- membership PLUS — for a private project — PrivateProjectMembers
-- membership. This mirrors assertProjectChannelAccess() on the REST side
-- (src/services/project.services.js) so the realtime subscription can't be
-- used to bypass that check by guessing a topic string.
alter table realtime.messages enable row level security;

drop policy if exists "workspace members can read their workspace chat" on realtime.messages;
drop policy if exists "workspace/project chat access" on realtime.messages;

create policy "workspace/project chat access"
on realtime.messages
for select
to authenticated
using (
  exists (
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
              and u."clerkId" = (auth.jwt() ->> 'sub')
          )
        )
    )
  )
);
