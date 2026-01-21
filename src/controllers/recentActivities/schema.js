const z = require("zod");

const createRecentActivityBodySchema = z.object({
  userId: z.string(),
  workspaceId: z.number(),
  title: z.string(),
  type: z.enum(["DOC", "WHITEBOARD", "TASK"]),
  typeID: z.number(),
  projectID: z.number(),
  lastEditedBy: z.date(),
});

const getAllRecentActivitiesSchema = z.object({
  userId: z.string(),
  workspaceId: z.string(),
});

module.exports = {
  createRecentActivityBodySchema,
  getAllRecentActivitiesSchema,
};
