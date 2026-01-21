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
    // validate
    const { userId, workspaceId } = getAllRecentActivitiesSchema.parse(
      req.query
    );
    // fetch all recent activities, ordered by createdAt ascending
    const recentActivities = await RecentActivities.findAll({
      where: { workspaceId, userId },
      order: [["createdAt", "ASC"]],
      limit: 5,
    });

    // send response
    res.status(200).json({
      success: true,
      data: recentActivities,
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activities",
    });
  }
};

module.exports = { createRecentActivity, getAllRecentActivities };
