const z = require("zod");

// schema for creating project
const createProjectSchema = z.object({
  projectName: z.string(),
  workspaceId: z.number(),
  admin: z.string(),
});

module.exports = { createProjectSchema };
