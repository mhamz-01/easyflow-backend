const { z } = require("zod");

// ─── Reusable primitives ──────────────────────────────────────────────────────

const positiveInt = z.number().int().positive();

const taskState = z.enum(["todo", "in progress", "done"]);
const taskPriority = z.enum(["low", "medium", "high"]);

// ─── Nested schemas ───────────────────────────────────────────────────────────

const checklistItemSchema = z.object({
  name: z.string(),
  items: z.array(z.string()),
});

// ─── Create ───────────────────────────────────────────────────────────────────

const createTaskSchema = z.object({
  workspaceId: positiveInt.optional().nullable(),
  projectId: positiveInt.optional().nullable(),
  name: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less"),
  description: z.string().optional().nullable(),
  links: z.array(z.string().url("Each link must be a valid URL")).optional(),
  documents: z.array(positiveInt).optional(),
  checklist: z.array(checklistItemSchema).optional(),
  state: taskState,
  priority: taskPriority,
  assignees: z.array(positiveInt).optional(),
  assigneeIds: z.array(positiveInt).optional(),
  dueDate: z.string().optional(),
  attachedFilesId: z.array(positiveInt).optional(),
  attachedDocs: z.array(positiveInt).optional().default([]),        // ✅ add
  attachedWhiteboards: z.array(positiveInt).optional().default([]), // ✅ add
})

// ─── Update ───────────────────────────────────────────────────────────────────

const updateTaskSchema = createTaskSchema.partial()

// ─── Patch: state ─────────────────────────────────────────────────────────────

const updateStateSchema = z.object({
  state: taskState,
});

// ─── Patch: priority ──────────────────────────────────────────────────────────

const updatePrioritySchema = z.object({
  priority: taskPriority,
});

// ─── Checklist item (add / update a single item) ──────────────────────────────

const checklistItemRouteSchema = z.object({
  name: z.string().min(1, "Checklist item name is required"),
  completed: z.boolean().optional(),
});

// ─── Bulk delete ──────────────────────────────────────────────────────────────

const deleteManySchema = z.object({
  taskIds: z.array(positiveInt).min(1, "At least one task ID is required"),
});

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateStateSchema,
  updatePrioritySchema,
  checklistItemSchema: checklistItemRouteSchema,
  deleteManySchema,
};
