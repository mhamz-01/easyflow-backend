const express = require("express");
const { validate } = require("../middlewares/validate");
const { requirePermission } = require("../middlewares/requirePermission");
const { requireChatChannelAccess } = require("../middlewares/requireChatChannelAccess");
const { sendMessageSchema } = require("../controllers/chat/schema");
const { sendMessage, listMessages } = require("../controllers/chat");
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

module.exports = router;
