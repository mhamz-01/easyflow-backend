const rolePermissions = {
  owner: ["*"],

  admin: [
    "workspace:update",
    "workspace:delete",
    "project:create",
    "project:read",
    "project:update",
    "project:delete",
    "project:manage-members",
    "task:read",
    "task:create",
    "task:update",
    "task:delete",
    "chat:read",
    "chat:post",
    "chat:manage-channels",
    "notification:read",
    "invite:manage",
    "document:manage-access",
    "whiteboard:manage-access",
  ],

  member: [
    "project:read",
    "task:read",
    "task:create",
    "task:update",
    "chat:read",
    "chat:post",
    "notification:read",
  ],

  // Any workspace member — including viewers — can participate in workspace chat
  // and read their own notifications.
  viewer: ["project:read", "task:read", "chat:read", "chat:post", "notification:read"],
};

module.exports = {
  rolePermissions,
};
