const z = require("zod");

const validateId = z.object({
  id: z.string(),
});

const getAllWhiteboardsSchema = z.object({
  projectId: z.string(),
  workspaceId: z.string(),
});

// update whiteboard schema — columnName is restricted to fields that are
// safe for any editor-level caller to touch directly; isPrivate/
// defaultAccess are access-control settings and go through their own
// dedicated, permission-checked routes instead (see
// grantWhiteboardAccessSchema / setWhiteboardDefaultAccessSchema).
const updateWhiteboardSchema = z.object({
  id: z.coerce.number(),
  columnName: z.enum(["whiteboardName", "content"]),
  value: z.any(),
});

const createWhiteboardBodySchema = z.object({
  workspaceId: z.number(),
  projectId: z.number(),
  createdBy: z.string(),
  whiteboardName:z.string().optional(),
  isPrivate: z.boolean().optional().default(false),
  defaultAccess: z.enum(["view", "edit"]).optional(),
});

// grant/update a per-user access override on a public whiteboard
const grantWhiteboardAccessSchema = z.object({
  userId: z.coerce.number(),
  accessLevel: z.enum(["view", "edit", "none"]),
});

// change a public whiteboard's default access level (creator or admin/owner)
const setWhiteboardDefaultAccessSchema = z.object({
  defaultAccess: z.enum(["view", "edit"]),
});

module.exports = {
  validateId,
  getAllWhiteboardsSchema,
  updateWhiteboardSchema,
  createWhiteboardBodySchema,
  grantWhiteboardAccessSchema,
  setWhiteboardDefaultAccessSchema,
};