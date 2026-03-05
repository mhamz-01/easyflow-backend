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

module.exports = {
  getProjectsForSidebar,
};
