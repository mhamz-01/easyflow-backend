  -- One-time infra setup — run manually in the Supabase Dashboard → SQL Editor.
  -- Not a Sequelize migration, same reasoning as chat-realtime-setup.sql: this
  -- touches Supabase's own `realtime` schema, which the app's regular DB role
  -- should not be altering as part of normal deploys.
  --
  -- Prerequisites:
  --   1. Clerk third-party auth already connected to this Supabase project
  --      (chat-realtime-setup.sql's prerequisite #1 — same connection, reused
  --      here).
  --   2. The `notifications` table already exists — run migration
  --      20260829000000-create-notifications.js first.
  --
  -- Topic scheme: workspace-notifications:{workspaceId}:{recipientUserId}
  -- (recipientUserId is the internal numeric users.id — the same id
  -- taskAssignees/notifications.recipientUserId use — NOT the Clerk sub
  -- string workspaceMembers.userId stores; the RLS policy below bridges the
  -- two via a join on users.clerkId).
  --
  -- Verify realtime.send()'s exact signature and realtime.topic() against
  -- your project's current Supabase docs before running — this API has
  -- changed across Supabase releases (same caveat as chat-realtime-setup.sql).

  -- ─── 1. Broadcast every new notification to its recipient's private topic ──────
  create or replace function public.broadcast_notification()
  returns trigger
  language plpgsql
  security definer
  as $$
  declare
    v_actor jsonb;
    v_topic text;
  begin
    select jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'imageUrl', u."imageUrl"
    )
    into v_actor
    from public.users u
    where u.id = new."actorUserId";

    v_topic := 'workspace-notifications:' || new."workspaceId"::text || ':' ||
              new."recipientUserId"::text;

    perform realtime.send(
      jsonb_build_object(
        'id', new.id,
        'workspaceId', new."workspaceId",
        'recipientUserId', new."recipientUserId",
        'type', new.type,
        'taskId', new."taskId",
        'projectId', new."projectId",
        'title', new.title,
        'body', new.body,
        'isRead', new."isRead",
        'createdAt', new."createdAt",
        'actor', v_actor
      ),
      'notification_created',   -- event
      v_topic,
      true                       -- private channel
    );
    return new;
  end;
  $$;

  drop trigger if exists notifications_broadcast on public."notifications";

  create trigger notifications_broadcast
  after insert on public."notifications"
  for each row execute function public.broadcast_notification();

  -- ─── 2. Gate subscription: only the recipient themself can listen in ──────────
  -- Topic segment 2 = workspaceId (must still be a member, same check as
  -- chat's policy); segment 3 = recipientUserId, which must resolve — via
  -- users.clerkId — to the caller's own Clerk sub. This is what stops user A
  -- from subscribing to `workspace-notifications:{ws}:{userB's id}` by just
  -- guessing/enumerating ids.
  --
  -- No `alter table realtime.messages enable row level security;` here —
  -- current Supabase projects ship with RLS already ON for that table by
  -- default, and even the SQL Editor's role typically doesn't own it, so
  -- re-running that ALTER fails with "must be owner of table messages"
  -- before it ever reaches the policy below. If CREATE POLICY itself hits
  -- the same error, RLS truly isn't enabled (rare) or your role lacks grants
  -- on realtime.messages — see the troubleshooting note at the bottom of
  -- this file.
  drop policy if exists "recipient can read their own notifications" on realtime.messages;

  create policy "recipient can read their own notifications"
  on realtime.messages
  for select
  to authenticated
  using (
    split_part(realtime.topic(), ':', 1) = 'workspace-notifications'
    and exists (
      select 1
      from public."workspaceMembers" wm
      where wm."userId" = (auth.jwt() ->> 'sub')
        and wm.status = true
        and wm."workspaceId"::text = split_part(realtime.topic(), ':', 2)
    )
    and exists (
      select 1
      from public.users u
      where u.id::text = split_part(realtime.topic(), ':', 3)
        and u."clerkId" = (auth.jwt() ->> 'sub')
    )
  );

  -- ─── 3. Harden chat's existing policy with a topic-prefix guard ───────────────
  -- REQUIRED companion change, not optional cleanup: chat's policy from
  -- chat-realtime-setup.sql checks workspace membership (segment 2) and
  -- general/project-channel access (segment 3) but never checks that segment
  -- 1 is actually "workspace-chat". Multiple permissive RLS policies on the
  -- same table combine with OR — so without this guard, a workspace member
  -- could satisfy *chat's* policy for a `workspace-notifications:{ws}:{n}`
  -- row whenever `n` happens to numerically collide with a project id they
  -- can see in that workspace, bypassing the recipient-only check in policy
  -- #2 above and reading another member's notification. This re-creates
  -- chat's policy verbatim plus one guard clause — pure narrowing, changes
  -- nothing for real chat topics.
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
                and u."clerkId" = (auth.jwt() ->> 'sub')
            )
          )
      )
    )
  );

  -- ─── Troubleshooting: "must be owner of table messages" (42501) ───────────────
  -- If this still fires on one of the CREATE POLICY statements above (not the
  -- ALTER, which has already been removed), your SQL Editor session isn't
  -- running with the privileges Supabase normally grants project owners on
  -- realtime.messages. In order of what to try:
  --   1. Re-run this script from Supabase Dashboard → SQL Editor directly
  --      (not a third-party client / migration tool using a scoped DB role)
  --      — the dashboard editor is what's expected to have the necessary
  --      grants.
  --   2. Check Dashboard → Database → Realtime → Policies — Supabase added a
  --      GUI for realtime.messages policies specifically because raw-SQL
  --      ownership issues like this one are common; creating the policy
  --      there sidesteps the privilege check entirely.
  --   3. If neither works, this is very likely a Supabase platform-version
  --      difference (the header comment above already flags that this API
  --      has changed across releases) — worth a quick check against
  --      Supabase's current "Broadcast from Database" docs before digging
  --      further.
