const { Op } = require("sequelize");
const { ChatMessage, User } = require("../database/models");
const { AppError } = require("../utils/AppError");

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
const createMessage = async ({ workspaceId, userId, content }) => {
  await assertNotRateLimited(workspaceId, userId);

  const message = await ChatMessage.create({ workspaceId, userId, content });

  return ChatMessage.findByPk(message.id, {
    include: [{ model: User, as: "author", attributes: AUTHOR_ATTRIBUTES }],
  });
};

// ─── Read (cursor-paginated, newest page first) ─────────────────────────────────
const getMessages = async ({ workspaceId, cursor = null, limit = 30 }) => {
  const where = { workspaceId };
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

module.exports = { createMessage, getMessages };
