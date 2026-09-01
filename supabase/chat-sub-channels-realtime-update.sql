-- One-time infra update — run manually in the Supabase Dashboard → SQL Editor.
-- Not a Sequelize migration, same reasoning as the other files in this
-- folder: touches Supabase's own `realtime` schema.
--
-- Prerequisites:
--   1. chat-realtime-setup.sql already run (this replaces two of its
--      functions, verbatim except for the change noted below).
--   2. Migration 20260902120000-create-chat-channels.js already run — this
--      depends on chatMessages."channelId" existing.
--
-- What this changes, and why the RLS policy needs NO changes at all:
-- General and a project's own main channel keep the exact same 3-segment
-- topic (`workspace-chat:{workspaceId}:{projectId|general}`) they always
-- had. A sub-channel message appends a 4th segment:
-- `workspace-chat:{workspaceId}:{projectId}:{channelId}`. Segment 3 is
-- still always the projectId (or "general") in both cases, and a
-- sub-channel's access is exactly its parent project's — so the existing
-- policy in chat-realtime-setup.sql, which only ever reads segments 1–3,
-- already authorizes sub-channel topics correctly without modification.
-- Only the two broadcast functions need to know segment 4 exists.

-- ─── 1. Broadcast every new chat message to its channel's topic ───────────────
-- Identical to chat-realtime-setup.sql's version except: the topic gains an
-- optional `:channelId` suffix, and the payload now includes `channelId` so
-- the frontend can route the message to the right sub-channel's cache entry.
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
             coalesce(new."projectId"::text, 'general') ||
             coalesce(':' || new."channelId"::text, '');

  perform realtime.send(
    jsonb_build_object(
      'id', new.id,
      'workspaceId', new."workspaceId",
      'projectId', new."projectId",
      'channelId', new."channelId",
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

-- ─── 2. Broadcast message deletion ─────────────────────────────────────────────
-- Same topic-suffix change as above; payload gains channelId for the same
-- routing reason.
create or replace function public.broadcast_chat_message_deleted()
returns trigger
language plpgsql
security definer
as $$
declare
  v_topic text;
begin
  if new."deletedAt" is null or old."deletedAt" is not null then
    return new;
  end if;

  v_topic := 'workspace-chat:' || new."workspaceId"::text || ':' ||
             coalesce(new."projectId"::text, 'general') ||
             coalesce(':' || new."channelId"::text, '');

  perform realtime.send(
    jsonb_build_object(
      'id', new.id,
      'workspaceId', new."workspaceId",
      'projectId', new."projectId",
      'channelId', new."channelId"
    ),
    'chat_message_deleted',   -- event
    v_topic,
    true                      -- private channel
  );
  return new;
end;
$$;

-- Triggers themselves are unchanged (still fire on the same table/events) —
-- create or replace above is enough, no need to drop/recreate them.
