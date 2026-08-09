const CHAT_API = {
  SEND_MESSAGE: "/messages", // POST: send a message to the workspace chat
  LIST_MESSAGES: "/messages", // GET: cursor-paginated message history
  DELETE_MESSAGE: "/messages/:messageId", // DELETE: soft-delete your own message
};

module.exports = {
  CHAT_API,
};
