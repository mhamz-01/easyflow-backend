const express = require("express");
const { validate } = require("../middlewares/validate");
const { requirePermission } = require("../middlewares/requirePermission");
const { requireChatChannelAccess } = require("../middlewares/requireChatChannelAccess");
const { requireProjectAccess } = require("../middlewares/requireProjectAccess");
const { sendMessageSchema, markReadSchema } = require("../controllers/chat/schema");
const { sendMessage, listMessages, deleteMessage, markRead, getUnread } = require("../controllers/chat");
const {
  getChannels,
  createChannel,
  renameChannel,
  deleteChannel,
} = require("../controllers/chat/channels");
const { CHAT_API } = require("../constants/chat.api");

const router = express.Router();

router.get(
  CHAT_API.LIST_MESSAGES,
  requirePermission("chat:read"),
  requireChatChannelAccess(),
  listMessages,
);

router.post(
  CHAT_API.SEND_MESSAGE,
  requirePermission("chat:post"),
  validate(sendMessageSchema),
  requireChatChannelAccess(),
  sendMessage,
);

// No requireChatChannelAccess() here — ownership (message.userId === req.user.id)
// is checked in the service, which is a strictly narrower gate than channel
// access anyway (you can only ever delete a message you were already allowed
// to post in the first place).
router.delete(
  CHAT_API.DELETE_MESSAGE,
  requirePermission("chat:post"),
  deleteMessage,
);

router.post(
  CHAT_API.MARK_READ,
  requirePermission("chat:read"),
  validate(markReadSchema),
  requireChatChannelAccess(),
  markRead,
);

// No requireChatChannelAccess() here — this isn't scoped to one channel,
// it returns every channel the user can see in one shot; the per-channel
// filtering happens inside getUnreadSummary (via getProjectsForSidebar)
// instead of at the route layer.
router.get(
  CHAT_API.GET_UNREAD,
  requirePermission("chat:read"),
  getUnread,
);

// ─── Sub-channels ───────────────────────────────────────────────────────────────
router.get(
  CHAT_API.LIST_CHANNELS,
  requirePermission("chat:read"),
  requireProjectAccess(),
  getChannels,
);
router.post(
  CHAT_API.CREATE_CHANNEL,
  requirePermission("chat:manage-channels"),
  requireProjectAccess(),
  createChannel,
);
router.patch(
  CHAT_API.RENAME_CHANNEL,
  requirePermission("chat:manage-channels"),
  requireProjectAccess(),
  renameChannel,
);
router.delete(
  CHAT_API.DELETE_CHANNEL,
  requirePermission("chat:manage-channels"),
  requireProjectAccess(),
  deleteChannel,
);

module.exports = router;
