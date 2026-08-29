const { Op } = require("sequelize");
const { Notification, User } = require("../database/models");

// ─── Message templates ──────────────────────────────────────────────────────
// Keyed by `type` so notifyTaskEvent stays a single generic entrypoint for
// every task-triggered notification instead of one function per event.
const TYPE_META = {
  TASK_ASSIGNED: (task, actorName) => ({
    title: "New task assigned",
    body: `${actorName} assigned you to "${task.name}"`,
  }),
  TASK_STATUS_CHANGED: (task, actorName, extra) => ({
    title: "Task status changed",
    body: `${actorName} moved "${task.name}" to ${extra.state}`,
  }),
  TASK_DUE_CHANGED: (task, actorName, extra) => ({
    title: "Due date changed",
    body: extra.dueDate
      ? `${actorName} set the due date for "${task.name}" to ${extra.dueDate}`
      : `${actorName} removed the due date for "${task.name}"`,
  }),
};

// ─── Create (fan-out) ───────────────────────────────────────────────────────
// One row per recipient — a plain bulkCreate (not a single JSON blob), so
// each recipient gets their own independent read state and their own
// realtime broadcast (the Supabase trigger fires per row, see
// supabase/notifications-realtime-setup.sql). The actor is always excluded
// from their own notification.
const notifyTaskEvent = async ({ type, task, actorUserId, recipientUserIds, extra = {} }) => {
  const recipients = [...new Set(recipientUserIds)].filter((id) => id != null && id !== actorUserId);
  if (recipients.length === 0) return [];

  const actor = await User.findByPk(actorUserId, { attributes: ["username"] });
  const actorName = actor?.username ?? "Someone";
  const { title, body } = TYPE_META[type](task, actorName, extra);

  const rows = recipients.map((recipientUserId) => ({
    workspaceId: task.workspaceId,
    recipientUserId,
    actorUserId,
    type,
    taskId: task.id,
    projectId: task.projectId ?? null,
    title,
    body,
  }));

  return Notification.bulkCreate(rows);
};

// ─── Read (cursor-paginated, newest first — same shape as chat history) ────
const getNotifications = async ({ recipientUserId, workspaceId, cursor = null, limit = 20 }) => {
  const where = { recipientUserId, workspaceId };
  if (cursor) where.id = { [Op.lt]: cursor };

  const notifications = await Notification.findAll({
    where,
    include: [{ model: User, as: "actor", attributes: ["id", "username", "imageUrl"] }],
    order: [["id", "DESC"]],
    limit: limit + 1,
  });

  const hasMore = notifications.length > limit;
  if (hasMore) notifications.pop();
  const nextCursor = hasMore ? notifications[notifications.length - 1].id : null;

  return { notifications, pagination: { nextCursor, hasMore, limit } };
};

const getUnreadCount = async ({ recipientUserId, workspaceId }) =>
  Notification.count({ where: { recipientUserId, workspaceId, isRead: false } });

// ─── Mark read ───────────────────────────────────────────────────────────────
// Scoped to recipientUserId in the WHERE clause (not just id) so a user can
// never mark someone else's notification read by guessing an id.
const markRead = async ({ id, recipientUserId }) => {
  const [count] = await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { id, recipientUserId, isRead: false } },
  );
  return count > 0;
};

const markAllRead = async ({ recipientUserId, workspaceId }) => {
  const [count] = await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { recipientUserId, workspaceId, isRead: false } },
  );
  return count;
};

module.exports = { notifyTaskEvent, getNotifications, getUnreadCount, markRead, markAllRead };
