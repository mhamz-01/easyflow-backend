const chatService = require("../../services/chat.service");
const { sendSuccess } = require("../../utils");
const { AppError } = require("../../utils/AppError");
const { getMessagesQuerySchema } = require("./schema");

// ─── POST /api/chat/messages ────────────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const { projectId, content, attachment } = req.body;

    const message = await chatService.createMessage({
      workspaceId,
      projectId,
      author: req.user,
      content,
      attachment,
    });
    sendSuccess(res, message, 201, "Message sent");
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/chat/messages ──────────────────────────────────────────────────────
const listMessages = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const { projectId, cursor, limit } = getMessagesQuerySchema.parse(req.query);

    const result = await chatService.getMessages({ workspaceId, projectId, cursor, limit });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/chat/messages/:messageId ────────────────────────────────────
const deleteMessage = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const messageId = Number(req.params.messageId);
    if (!Number.isInteger(messageId) || messageId <= 0) {
      throw new AppError("Invalid message id", 400);
    }

    const result = await chatService.deleteMessage({
      workspaceId,
      messageId,
      userId: req.user.id,
    });
    sendSuccess(res, result, 200, "Message deleted");
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/chat/read ──────────────────────────────────────────────────────
// req.body here is already Zod-coerced by validate(markReadSchema) —
// projectId/lastMessageId are numbers or undefined, never raw strings.
const markRead = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const { projectId, lastMessageId } = req.body;

    const result = await chatService.markChannelRead({
      userId: req.user.id,
      workspaceId,
      projectId: projectId ?? null,
      lastMessageId,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/chat/unread ──────────────────────────────────────────────────────
// No projectId param — returns every channel this user can see in one
// shot, since that's exactly what the sidebar + channel rail need to paint
// every badge at once without one request per channel.
const getUnread = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const channels = await chatService.getUnreadSummary({
      userId: req.user.id,
      workspaceId,
    });
    sendSuccess(res, { channels });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, listMessages, deleteMessage, markRead, getUnread };
