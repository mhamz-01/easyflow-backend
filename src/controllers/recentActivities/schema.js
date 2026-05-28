const z = require("zod");

// schema.js
const createRecentActivityBodySchema = z.object({
  workspaceId: z.number(),
  userId: z.string(),
  title: z.string(),
  type: z.enum(["DOC", "WHITEBOARD", "TASK"]),
  typeID: z.number(),
  projectID: z.number(),
  lastEditedBy: z.string(), 
});

const getAllRecentActivitiesSchema = z.object({
  userId: z.string(),
  workspaceId: z.string(),
});

module.exports = {
  createRecentActivityBodySchema,
  getAllRecentActivitiesSchema,
};
