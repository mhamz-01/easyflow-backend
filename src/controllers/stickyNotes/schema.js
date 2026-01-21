const { z } = require("zod");

const updateBodySchema = z.object({
  id: z.string(),
});
const paramsSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
});

const bodySchema = z.object({
  workspaceId: z.number(),
  userId: z.string(),
});

const deleteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),
});
module.exports = { paramsSchema, bodySchema, deleteSchema, updateBodySchema };
