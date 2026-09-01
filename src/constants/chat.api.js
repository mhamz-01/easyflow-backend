const CHAT_API = {
  SEND_MESSAGE: "/messages", // POST: send a message to the workspace chat
  LIST_MESSAGES: "/messages", // GET: cursor-paginated message history
  DELETE_MESSAGE: "/messages/:messageId", // DELETE: soft-delete your own message
  MARK_READ: "/read", // POST: advance your read cursor for a channel
  GET_UNREAD: "/unread", // GET: unread status for every channel you can see
  LIST_CHANNELS: "/projects/:projectId/channels", // GET: sub-channels of a project
  CREATE_CHANNEL: "/projects/:projectId/channels", // POST: admin/owner only
  RENAME_CHANNEL: "/projects/:projectId/channels/:channelId", // PATCH: admin/owner only
  DELETE_CHANNEL: "/projects/:projectId/channels/:channelId", // DELETE: admin/owner only
};

module.exports = {
  CHAT_API,
};
