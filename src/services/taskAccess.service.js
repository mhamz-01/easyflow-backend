const { ADMIN_ROLES } = require("./auth/workspaceMember");

// Deliberately narrower than the document/whiteboard ACL: no defaultAccess,
// no per-user overrides, no view/edit split — a private task is visible
// only to its creator and to workspace admin/owner. Everyone else
// (including other assignees) is treated as if the task doesn't exist.
const canAccessTask = ({ task, userId, role }) => {
  if (!task.isPrivate) return true;
  if (ADMIN_ROLES.includes(role)) return true;
  return task.createdBy === userId;
};

module.exports = { canAccessTask };
