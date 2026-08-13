const { WorkspaceMember } = require("../../database/models");

// Workspace admin/owner always get full edit access on any public
// document/whiteboard, unconditionally — no per-user override or resource
// default can restrict them. Shared across resources since this is a
// workspace-role concept, not a document/whiteboard concept.
const ADMIN_ROLES = ["owner", "admin"];

async function findWorkspaceMemberRole(userId, workspaceId) {
  const membership = await WorkspaceMember.findOne({
    where: {
      userId: userId,
      workspaceId: workspaceId,
    },
    attributes: ["role"], // only fetch role for performance
  });

  if (!membership) {
    return null;
  }

  return membership.role;
}

module.exports = {
  findWorkspaceMemberRole,
  ADMIN_ROLES,
};
