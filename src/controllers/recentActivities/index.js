const { RecentActivities } = require("../../database/models");
const {
  createRecentActivityBodySchema,
  getAllRecentActivitiesSchema,
} = require("./schema");

const createRecentActivity = async (req, res) => {
  try {
    // validate req body
    const {
      workspaceId,
      userId,
      title,
      type,
      typeID,
      projectID,
      lastEditedBy,
    } = createRecentActivityBodySchema.parse(req.body);

    // create recent activity
    const recentActivity = await RecentActivities.create({
      workspaceId,
      userId,
      title,
      type,
      typeID,
      projectID,
      lastEditedBy,
    });

    // if created then send response
    if (recentActivity) {
      res.status(200).json({
        success: true,
        message: "recent activity created successfully",
        recentActivity,
      });
    }
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create recent activity",
    });
  }
};



const getAllRecentActivities = async (req, res) => {
  try {
    const { workspaceId, projectId, limit } = getAllRecentActivitiesSchema.parse(req.query);

    // Single query with LEFT JOINs instead of the list fetch plus two
    // batched follow-up lookups (was already fixed once from an N+1 to this
    // 3-query batch — the editor/project joins below collapse it to 1).
    const recentActivities = await RecentActivities.findAll({
      where: projectId ? { workspaceId, projectID: projectId } : { workspaceId },
      include: [
        { association: "editor", attributes: ["username", "imageUrl"] },
        { association: "project", attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit,
    });

    const data = recentActivities.map((activity) => {
      const { editor, project, ...rest } = activity.toJSON();
      return {
        ...rest,
        editor: editor ? { username: editor.username, imageUrl: editor.imageUrl } : null,
        projectName: project?.name ?? null,
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch recent activities" });
  }
};
module.exports = { createRecentActivity, getAllRecentActivities };
