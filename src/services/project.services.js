const { Op } = require("sequelize");
const { Project, PrivateProjectMember } = require("../database/models");

const getProjectsForSidebar = async (workspaceId, userId) => {
  const privateProjectIds = await PrivateProjectMember.findAll({
    where: { userId },
    attributes: ["projectId"],
    raw: true,
  });

  const projectIds = privateProjectIds.map((p) => p.projectId);

  const projects = await Project.findAll({
    where: {
      workspaceId,
      [Op.or]: [
        { type: "public" },
        {
          type: "private",
          id: {
            [Op.in]: projectIds,
          },
        },
      ],
    },
    attributes: ["id", "name"],
    order: [["createdAt", "ASC"]],
  });

  return projects;
};

// Guards a project's chat channel: public projects are open to any
// workspace member (workspace-role check already happened via
// requirePermission), private ones require PrivateProjectMember. Unlike
// getProjectsForSidebar (a listing filter), this is an enforced check —
// project chat is a new surface reachable directly (REST + realtime
// subscription), not one that only ever shows up already-filtered.
const assertProjectChannelAccess = async ({ projectId, workspaceId, userId }) => {
  const project = await Project.findOne({
    where: { id: projectId, workspaceId },
    attributes: ["id", "type"],
  });

  if (!project) return false;
  if (project.type === "public") return true;

  const membership = await PrivateProjectMember.findOne({
    where: { projectId, userId },
  });
  return !!membership;
};

module.exports = {
  getProjectsForSidebar,
  assertProjectChannelAccess,
};
