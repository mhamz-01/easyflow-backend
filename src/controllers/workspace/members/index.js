const { WorkspaceMember, User } = require("../../../database/models");

//
const getWorkspaceMembers = async (req, res) => {
  const { workspaceId } = req.query;
  // get workspace members
  const members = await WorkspaceMember.findAll({
    where: { workspaceId },
    include: [
      {
        model: User,
      },
    ],
  });

  // send members in res
  res.status(200).json({
    success: true,
    members,
  });
};

module.exports = { getWorkspaceMembers };
