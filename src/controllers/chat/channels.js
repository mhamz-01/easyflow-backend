const chatService = require("../../services/chat.service");
const { sendSuccess } = require("../../utils");
const { createChannelSchema, renameChannelSchema } = require("./schema");

// req.projectId is set by requireProjectAccess, which already confirmed the
// caller can see this project (workspace admin/owner, or an active member).

const getChannels = async (req, res, next) => {
  try {
    const channels = await chatService.listChannels(req.projectId);
    sendSuccess(res, { channels });
  } catch (err) {
    next(err);
  }
};

const createChannel = async (req, res, next) => {
  try {
    const { name } = createChannelSchema.parse(req.body);
    const channel = await chatService.createChannel({
      projectId: req.projectId,
      name,
      createdBy: req.user.id,
    });
    sendSuccess(res, channel, 201, "Channel created");
  } catch (err) {
    next(err);
  }
};

const renameChannel = async (req, res, next) => {
  try {
    const { name } = renameChannelSchema.parse(req.body);
    const channel = await chatService.renameChannel({
      projectId: req.projectId,
      channelId: Number(req.params.channelId),
      name,
    });
    sendSuccess(res, channel, 200, "Channel renamed");
  } catch (err) {
    next(err);
  }
};

const deleteChannel = async (req, res, next) => {
  try {
    await chatService.deleteChannel({
      projectId: req.projectId,
      channelId: Number(req.params.channelId),
    });
    sendSuccess(res, { id: Number(req.params.channelId) }, 200, "Channel deleted");
  } catch (err) {
    next(err);
  }
};

module.exports = { getChannels, createChannel, renameChannel, deleteChannel };
