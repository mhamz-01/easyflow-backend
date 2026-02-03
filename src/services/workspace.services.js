const { Workspace } = require("../database/models");

const getWorkspaceName = async (workspaceId) => {
  if (!workspaceId) {
    throw new Error("workspaceId is required");
  }

  const workspace = await Workspace.findByPk(workspaceId, {
    attributes: ["workspaceName"],
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace.workspaceName;
};

module.exports = {
  getWorkspaceName,
};
