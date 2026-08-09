const CHAT_API = {
  SEND_MESSAGE: "/messages", // POST: send a message to the workspace chat
  LIST_MESSAGES: "/messages", // GET: cursor-paginated message history
  DELETE_MESSAGE: "/messages/:messageId", // DELETE: soft-delete your own message
  MARK_READ: "/read", // POST: advance your read cursor for a channel
  GET_UNREAD: "/unread", // GET: unread status for every channel you can see
};

module.exports = {
  CHAT_API,
};
