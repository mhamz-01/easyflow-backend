const rolePermissions = {
  owner: ["*"],

  admin: [
    "workspace:update",
    "workspace:delete",
    "project:create",
    "project:update",
    "project:delete",
    "task:read",
    "task:create",
    "task:update",
    "task:delete",
    "chat:read",
    "chat:post",
    "notification:read",
    "invite:manage",
    "document:manage-access",
    "whiteboard:manage-access",
  ],

  member: [
    "task:read",
    "task:create",
    "task:update",
    "chat:read",
    "chat:post",
    "notification:read",
  ],

  // Any workspace member — including viewers — can participate in workspace chat
  // and read their own notifications.
  viewer: ["task:read", "chat:read", "chat:post", "notification:read"],
};

module.exports = {
  rolePermissions,
};
