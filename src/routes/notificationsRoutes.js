const express = require("express");
const { requirePermission } = require("../middlewares/requirePermission");
const {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} = require("../controllers/notifications");
const { NOTIFICATIONS_API } = require("../constants/notifications.api");

const router = express.Router();

router.get(NOTIFICATIONS_API.LIST, requirePermission("notification:read"), listNotifications);
router.get(
  NOTIFICATIONS_API.UNREAD_COUNT,
  requirePermission("notification:read"),
  getUnreadCount,
);
router.post(NOTIFICATIONS_API.MARK_READ, requirePermission("notification:read"), markRead);
router.post(
  NOTIFICATIONS_API.MARK_ALL_READ,
  requirePermission("notification:read"),
  markAllRead,
);

module.exports = router;
