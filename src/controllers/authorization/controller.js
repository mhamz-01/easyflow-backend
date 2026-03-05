const {
  findWorkspaceMemberRole,
} = require("../../services/auth/workspaceMember");

async function getUserRole(userId, workspaceId) {
  return await findWorkspaceMemberRole(userId, workspaceId);
}

// Strict version (recommended for authorization)
async function getUserRoleOrThrow(userId, workspaceId) {
  const role = await findWorkspaceMemberRole(userId, workspaceId);

  if (!role) {
    const error = new Error("User is not a member of this workspace");
    error.statusCode = 403;
    throw error;
  }

  return role;
}

module.exports = {
  getUserRole,
  getUserRoleOrThrow,
};
