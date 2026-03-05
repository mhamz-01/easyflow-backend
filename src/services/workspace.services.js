const { Workspace } = require("../database/models");

const getWorkspaceBySlug = async (workspaceSlug) => {
  return await Workspace.findOne({
    where: { workspaceSlug },
  });
};
const getWorkspaceNameAndSlug = async (workspaceId) => {
  if (!workspaceId) {
    throw new Error("workspaceId is required");
  }

  const workspace = await Workspace.findByPk(workspaceId, {
    attributes: ["workspaceName", "workspaceSlug"],
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
};

module.exports = {
  getWorkspaceBySlug,
  getWorkspaceNameAndSlug,
};
