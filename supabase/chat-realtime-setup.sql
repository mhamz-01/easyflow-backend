-- One-time infra setup — run manually in the Supabase Dashboard → SQL Editor.
-- Not a Sequelize migration: it touches Supabase's own `realtime` schema,
-- which the app's regular DB role should not be altering as part of normal
-- deploys.
--
-- Prerequisites (see project chat notes):
--   1. Clerk third-party auth connected to this Supabase project, so that
--      auth.jwt() inside RLS reflects the Clerk session token's claims.
--   2. The `chatMessages` table already exists (created by the
--      20260801120000-create-chat-messages.js migration).
--
-- Verify realtime.broadcast_changes()'s exact signature and realtime.topic()
-- against your project's current Supabase docs (Database → Realtime →
-- Broadcast from Database) before running — this API has changed across
-- Supabase releases.

-- ─── 1. Broadcast every new chat message to workspace-chat:{workspaceId} ───────
-- Uses realtime.send() (not broadcast_changes()) so the payload can carry the
-- joined author (username/imageUrl), matching the shape the REST endpoint
-- already returns — the frontend can use one ChatMessage type for both.
create or replace function public.broadcast_chat_message()
returns trigger
language plpgsql
security definer
as $$
declare
  v_author jsonb;
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

  perform realtime.send(
    jsonb_build_object(
      'id', new.id,
      'workspaceId', new."workspaceId",
      'userId', new."userId",
      'content', new.content,
      'editedAt', new."editedAt",
      'createdAt', new."createdAt",
      'updatedAt', new."updatedAt",
      'author', v_author
    ),
    'chat_message',                                  -- event
    'workspace-chat:' || new."workspaceId"::text,     -- topic
    true                                              -- private channel
  );
  return new;
end;
$$;

drop trigger if exists chat_messages_broadcast on public."chatMessages";

create trigger chat_messages_broadcast
after insert on public."chatMessages"
for each row execute function public.broadcast_chat_message();

-- ─── 2. Only workspace members may subscribe to their workspace's channel ──────
alter table realtime.messages enable row level security;

drop policy if exists "workspace members can read their workspace chat" on realtime.messages;

create policy "workspace members can read their workspace chat"
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
);
