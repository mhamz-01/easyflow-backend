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
  ],

  member: ["task:read", "task:create", "task:update"],

  viewer: ["task:read"],
};

module.exports = {
  rolePermissions,
};
