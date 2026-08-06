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
    "invite:manage",
  ],

  member: ["task:read", "task:create", "task:update", "chat:read", "chat:post"],

  // Any workspace member — including viewers — can participate in workspace chat.
  viewer: ["task:read", "chat:read", "chat:post"],
};

module.exports = {
  rolePermissions,
};
