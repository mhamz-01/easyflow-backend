const z = require("zod");

// schema for getting single doc
const validateId = z.object({
  id: z.string(),
});
// schema for getting all docs
const getAllDocSchema = z.object({
  projectId: z.string(),
  workspaceId: z.string(),
});

// update doc schema — columnName is restricted to fields that are safe for
// any editor-level caller to touch directly; isPrivate/defaultAccess are
// access-control settings and go through their own dedicated, permission-
// checked routes instead (see grantDocAccessSchema / setDefaultAccessSchema).
const updateDocSchema = z.object({
  id: z.coerce.number(),
  columnName: z.enum(["documentName", "content"]),
  value: z.any(),
});
// body schema for createDoc
const createDocBodySchema = z.object({
  workspaceId: z.number(),
  projectId: z.number(),
  createdBy: z.string(),
  documentName: z.string().optional(),
  isPrivate: z.boolean().optional().default(false),
  defaultAccess: z.enum(["view", "edit"]).optional(),
});

// grant/update a per-user access override on a public document
const grantDocAccessSchema = z.object({
  userId: z.coerce.number(),
  accessLevel: z.enum(["view", "edit", "none"]),
});

// change a public document's default access level (creator or admin/owner)
const setDefaultAccessSchema = z.object({
  defaultAccess: z.enum(["view", "edit"]),
});

module.exports = {
  getAllDocSchema,
  createDocBodySchema,
  validateId,
  updateDocSchema,
  grantDocAccessSchema,
  setDefaultAccessSchema,
};
