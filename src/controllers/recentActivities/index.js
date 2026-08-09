const { RecentActivities , User, Project } = require("../../database/models");
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
    const { workspaceId, limit } = getAllRecentActivitiesSchema.parse(req.query);

    const recentActivities = await RecentActivities.findAll({
      where: { workspaceId },
      order: [["createdAt", "DESC"]],
      limit,
    });

    // Batch the per-row lookups instead of firing 2 queries per activity
    // (was an N+1: 1 + 2*limit round trips for a list this small).
    const editorClerkIds = [...new Set(recentActivities.map((a) => a.lastEditedBy).filter(Boolean))];
    const projectIds = [...new Set(recentActivities.map((a) => a.projectID).filter(Boolean))];

    const [editors, projects] = await Promise.all([
      editorClerkIds.length
        ? User.findAll({
            where: { clerkId: editorClerkIds },
            attributes: ["clerkId", "username", "imageUrl"],
          })
        : [],
      projectIds.length
        ? Project.findAll({
            where: { id: projectIds },
            attributes: ["id", "name"],
          })
        : [],
    ]);

    const editorByClerkId = new Map(editors.map((e) => [e.clerkId, e]));
    const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

    const data = recentActivities.map((activity) => {
      const editor = editorByClerkId.get(activity.lastEditedBy);
      return {
        ...activity.toJSON(),
        editor: editor ? { username: editor.username, imageUrl: editor.imageUrl } : null,
        projectName: projectNameById.get(activity.projectID) ?? null,
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch recent activities" });
  }
};
module.exports = { createRecentActivity, getAllRecentActivities };
