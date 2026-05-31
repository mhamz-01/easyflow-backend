const { RecentActivities , User } = require("../../database/models");
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
    const { workspaceId } = getAllRecentActivitiesSchema.parse(req.query);

    const recentActivities = await RecentActivities.findAll({
      where: { workspaceId }, // ✅ only filter by workspace
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    const data = await Promise.all(
      recentActivities.map(async (activity) => {
        const editor = await User.findOne({
          where: { clerkId: activity.lastEditedBy },
          attributes: ["username", "imageUrl"],
        });
        return {
          ...activity.toJSON(),
          editor: editor ? { username: editor.username, imageUrl: editor.imageUrl } : null,
        };
      })
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch recent activities" });
  }
};
module.exports = { createRecentActivity, getAllRecentActivities };
