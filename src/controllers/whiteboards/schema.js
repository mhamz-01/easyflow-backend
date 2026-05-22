const z = require("zod");

const validateId = z.object({
  id: z.string(),
});

const getAllWhiteboardsSchema = z.object({
  projectId: z.string(),
  workspaceId: z.string(),
});

const updateWhiteboardSchema = z.object({
  id: z.coerce.number(),
  columnName: z.string(),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.date(),
    z.any(),
  ]),
});

const createWhiteboardBodySchema = z.object({
  workspaceId: z.number(),
  projectId: z.number(),
  createdBy: z.string(),
  whiteboardName:z.string().optional(),
  isPrivate: z.boolean().optional().default(false),
});

module.exports = {
  validateId,
  getAllWhiteboardsSchema,
  updateWhiteboardSchema,
  createWhiteboardBodySchema,
};