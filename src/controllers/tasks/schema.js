// validators/taskValidator.js
const { z } = require("zod");

const checklistItemSchema = z.object({
  name: z.string(),
  items: z.array(z.string()),
});

const createTaskSchema = z.object({
  workspaceId: z.number().int().positive().optional().nullable(),
  projectId: z.number().int().positive().optional().nullable(),
  name: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or less"),
  description: z.string().optional().nullable(),
  links: z.array(z.string()).optional(),
  documents: z.array(z.number()).optional(),
  checklist: z.array(checklistItemSchema).optional(),
  state: z.enum(["todo", "in progress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  assignees: z.array(z.number()).optional(),
  dueDate: z.string().optional(),
  attachedFilesId: z.array(z.number()).optional(),
});

const updateTaskSchema = createTaskSchema.partial().strict();

module.exports = {
  createTaskSchema,
  updateTaskSchema,
};
