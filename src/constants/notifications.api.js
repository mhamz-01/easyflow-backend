const NOTIFICATIONS_API = {
  LIST: "/", // GET: cursor-paginated notification history for the current user
  UNREAD_COUNT: "/unread-count", // GET: unread count for the bell badge
  MARK_READ: "/:id/read", // POST: mark a single notification read
  MARK_ALL_READ: "/read-all", // POST: mark every unread notification read
};

module.exports = {
  NOTIFICATIONS_API,
};
