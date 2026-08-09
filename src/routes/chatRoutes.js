const express = require("express");
const { validate } = require("../middlewares/validate");
const { requirePermission } = require("../middlewares/requirePermission");
const { requireChatChannelAccess } = require("../middlewares/requireChatChannelAccess");
const { sendMessageSchema } = require("../controllers/chat/schema");
const { sendMessage, listMessages, deleteMessage } = require("../controllers/chat");
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

module.exports = router;
