const { Op } = require("sequelize");
const { ChatMessage, ChatReadState, User } = require("../database/models");
const { AppError } = require("../utils/AppError");
const { getProjectsForSidebar } = require("./project.services");

// ─── Anti-spam guard ───────────────────────────────────────────────────────────
// Simple DB-backed rate limit (no Redis in this stack) — good enough for a
// single-workspace, low-volume chat. Revisit if message volume grows.
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_MESSAGES = 10;

const AUTHOR_ATTRIBUTES = ["id", "username", "email", "imageUrl"];

const assertNotRateLimited = async (workspaceId, userId) => {
  const recentCount = await ChatMessage.count({
    where: {
      workspaceId,
      userId,
      createdAt: { [Op.gte]: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
    },
  });

  if (recentCount >= RATE_LIMIT_MAX_MESSAGES) {
    throw new AppError("You're sending messages too fast. Please slow down.", 429);
  }
};

// ─── Create ─────────────────────────────────────────────────────────────────────
// `author` is the requester's own profile, already fetched once by
// attachUserAndWorkspaceId — reused here instead of a second author lookup
// (findByPk + join) after the insert. `projectId` null = General channel.
// Rate limiting stays workspace-wide (not per-channel) on purpose.
const createMessage = async ({ workspaceId, projectId = null, author, content, attachment }) => {
  await assertNotRateLimited(workspaceId, author.id);

  const message = await ChatMessage.create({
    workspaceId,
    projectId,
    userId: author.id,
    content: content ?? null,
    attachment: attachment ?? null,
  });

  return {
    id: message.id,
    workspaceId: message.workspaceId,
    projectId: message.projectId,
    userId: message.userId,
    content: message.content,
    attachment: message.attachment,
    editedAt: message.editedAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    author,
  };
};

// ─── Read (cursor-paginated, newest page first) ─────────────────────────────────
const getMessages = async ({ workspaceId, projectId = null, cursor = null, limit = 30 }) => {
  const where = { workspaceId, projectId };
  if (cursor) {
    where.id = { [Op.lt]: cursor }; // older than the last message the client has
  }

  const messages = await ChatMessage.findAll({
    where,
    include: [{ model: User, as: "author", attributes: AUTHOR_ATTRIBUTES }],
    order: [["id", "DESC"]],
    limit: limit + 1, // fetch one extra to know if more history exists
  });

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  const nextCursor = hasMore ? messages[messages.length - 1].id : null;

  return {
    messages: messages.reverse(), // oldest → newest for rendering
    pagination: { nextCursor, hasMore, limit },
  };
};

// ─── Delete (soft — paranoid: true sets deletedAt) ──────────────────────────
// Scoped to workspaceId (can't reach into another workspace by id-guessing)
// and to the requester being the author — no admin-delete-others-messages
// path for now, keep it simple. The soft-delete UPDATE is what the Supabase
// trigger in chat-realtime-setup.sql listens for to broadcast the removal.
const deleteMessage = async ({ workspaceId, messageId, userId }) => {
  const message = await ChatMessage.findOne({ where: { id: messageId, workspaceId } });
  if (!message) {
    throw new AppError("Message not found", 404);
  }
  if (message.userId !== userId) {
    throw new AppError("You can only delete your own messages", 403);
  }

  const { id, projectId } = message;
  await message.destroy();

  return { id, projectId };
};

// ─── Read cursor (per user, per channel) ─────────────────────────────────────
// "Mark read": the client passes the highest message id it actually
// rendered when it knows one (avoids an extra query on the common path —
// opening a channel that already has messages loaded); if omitted, the
// true latest message id in that channel is looked up server-side instead
// (e.g. a generic "catch me up" call, or opening a channel with nothing
// loaded yet). The cursor only ever moves forward — never regresses from a
// stale/out-of-order call — since a lower incoming id just means "I already
// know about something newer."
const markChannelRead = async ({ userId, workspaceId, projectId = null, lastMessageId }) => {
  let targetId = lastMessageId ?? null;

  if (targetId == null) {
    targetId = await ChatMessage.max("id", { where: { workspaceId, projectId } });
  }

  const [state] = await ChatReadState.findOrCreate({
    where: { userId, workspaceId, projectId },
    defaults: { lastReadMessageId: targetId ?? null },
  });

  if (targetId != null && (state.lastReadMessageId ?? 0) < targetId) {
    state.lastReadMessageId = targetId;
    await state.save();
  }

  return { projectId, lastReadMessageId: state.lastReadMessageId };
};

// ─── Unread summary (sidebar + channel-rail badges) ──────────────────────────
// One entry per channel this user can actually see — General plus every
// project `getProjectsForSidebar` resolves for them, so a private project
// they're not a member of is never even considered (consistent with every
// other channel-access check in this feature; a badge is exactly the kind
// of "frontend wouldn't have shown you this" leak that channel access has
// been deliberately guarded against elsewhere). "Unread" = the channel's
// latest message id is higher than this user's read cursor for it — no
// cursor at all (never opened) counts as unread if the channel has any
// messages.
const getUnreadSummary = async ({ userId, workspaceId }) => {
  const projects = await getProjectsForSidebar(workspaceId, userId);
  const projectIds = projects.map((p) => p.id);
  const channelIds = [null, ...projectIds];

  const sequelize = ChatMessage.sequelize;
  const channelWhere = {
    workspaceId,
    [Op.or]: [{ projectId: null }, { projectId: { [Op.in]: projectIds } }],
  };

  const [latestRows, readRows] = await Promise.all([
    ChatMessage.findAll({
      attributes: ["projectId", [sequelize.fn("MAX", sequelize.col("id")), "latestId"]],
      where: channelWhere,
      group: ["projectId"],
      raw: true,
    }),
    ChatReadState.findAll({
      where: { userId, workspaceId },
      attributes: ["projectId", "lastReadMessageId"],
      raw: true,
    }),
  ]);

  const latestByChannel = new Map(latestRows.map((r) => [r.projectId, Number(r.latestId)]));
  const readByChannel = new Map(readRows.map((r) => [r.projectId, r.lastReadMessageId]));

  return channelIds.map((projectId) => {
    const latestId = latestByChannel.get(projectId) ?? null;
    const lastReadId = readByChannel.get(projectId) ?? null;
    const unread = latestId != null && (lastReadId == null || lastReadId < latestId);
    return { projectId, unread };
  });
};

module.exports = { createMessage, getMessages, deleteMessage, markChannelRead, getUnreadSummary };
