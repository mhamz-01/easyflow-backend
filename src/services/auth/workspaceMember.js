const { WorkspaceMember } = require("../../database/models");

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
};
