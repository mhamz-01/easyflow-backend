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

// update doc schema
const updateDocSchema = z.object({
  id: z.coerce.number(),
  columnName: z.string(),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.date(),
    z.any(), // for JSON / editor payloads
  ]),
});
// body schema for createDoc
const createDocBodySchema = z.object({
  workspaceId: z.number(),
  projectId: z.number(),
  createdBy: z.string(),
  documentName: z.string().optional(),
  isPrivate: z.boolean().optional().default(false),
});
module.exports = {
  getAllDocSchema,
  createDocBodySchema,
  validateId,
  updateDocSchema,
};
