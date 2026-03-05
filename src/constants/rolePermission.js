const rolePermissions = {
  owner: ["*"],

  admin: [
    "workspace:update",
    "workspace:delete",
    "project:create",
    "project:update",
    "project:delete",
    "task:create",
    "task:update",
    "task:delete",
  ],

  member: ["task:create", "task:update"],

  viewer: ["task:view"],
};

module.exports = {
  rolePermissions,
};
