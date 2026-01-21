const z = require("zod");

// schema for creating workspace
const createWorkspaceSchema = z.object({
  workspaceName: z.string(),
});

module.exports = { createWorkspaceSchema };
