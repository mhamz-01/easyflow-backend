const chatService = require("../../services/chat.service");
const { sendSuccess } = require("../../utils");
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

module.exports = { sendMessage, listMessages };
