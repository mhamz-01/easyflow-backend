const notificationService = require("../../services/notification.service");
const { sendSuccess } = require("../../utils");
const { AppError } = require("../../utils/AppError");
const { listNotificationsQuerySchema } = require("./schema");

// ─── GET /api/notifications ───────────────────────────────────────────────────
const listNotifications = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const { cursor, limit } = listNotificationsQuerySchema.parse(req.query);

    const result = await notificationService.getNotifications({
      recipientUserId: req.user.id,
      workspaceId,
      cursor,
      limit,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
const getUnreadCount = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const count = await notificationService.getUnreadCount({
      recipientUserId: req.user.id,
      workspaceId,
    });
    sendSuccess(res, { count });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/notifications/:id/read ────────────────────────────────────────
const markRead = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("Invalid notification id", 400);
    }

    const updated = await notificationService.markRead({ id, recipientUserId: req.user.id });
    sendSuccess(res, { updated });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/notifications/read-all ────────────────────────────────────────
const markAllRead = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const count = await notificationService.markAllRead({
      recipientUserId: req.user.id,
      workspaceId,
    });
    sendSuccess(res, { count });
  } catch (err) {
    next(err);
  }
};

module.exports = { listNotifications, getUnreadCount, markRead, markAllRead };
