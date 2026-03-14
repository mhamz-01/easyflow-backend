const express = require("express");
const { validate } = require("../middlewares/validate");
const { requirePermission } = require("../middlewares/requirePermission");

const {
  createTaskSchema,
  updateTaskSchema,
  updateStateSchema,
  updatePrioritySchema,
  checklistItemSchema,
  deleteManySchema,
} = require("../controllers/tasks/schema");

const {
  createTask,
  getTask,
  getWorkspaceTasks,
  getProjectTasks,
  getAssigneeTasks,
  updateTask,
  updateTaskState,
  updateTaskPriority,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
  deleteTask,
  deleteManyTasks,
} = require("../controllers/tasks");

const router = express.Router({ mergeParams: true });

// ─── Create ───────────────────────────────────────────────────────────────────
router.post(
  "/",
  requirePermission("task:create"),
  validate(createTaskSchema),
  createTask,
);

// ─── Read ─────────────────────────────────────────────────────────────────────

router.get(
  "/", // GET /api/projects/:projectId/tasks
  requirePermission("task:read"),
  getProjectTasks, // projectId available via req.params.projectId
);

router.get(
  "/:taskId", // GET /api/projects/:projectId/tasks/:taskId
  requirePermission("task:read"),
  getTask,
);

// ─── Update ───────────────────────────────────────────────────────────────────
router.put(
  "/:taskId",
  requirePermission("task:update"),
  validate(updateTaskSchema),
  updateTask,
);

router.patch(
  "/:taskId/state",
  requirePermission("task:update"),
  validate(updateStateSchema),
  updateTaskState,
);

router.patch(
  "/:taskId/priority",
  requirePermission("task:update"),
  validate(updatePrioritySchema),
  updateTaskPriority,
);

// ─── Checklist ────────────────────────────────────────────────────────────────
router.post(
  "/:taskId/checklist",
  requirePermission("task:update"),
  validate(checklistItemSchema),
  addChecklistItem,
);

router.patch(
  "/:taskId/checklist/:itemId",
  requirePermission("task:update"),
  updateChecklistItem,
);

router.delete(
  "/:taskId/checklist/:itemId",
  requirePermission("task:update"),
  removeChecklistItem,
);

// ─── Delete ───────────────────────────────────────────────────────────────────
router.delete(
  "/bulk",
  requirePermission("task:delete"),
  validate(deleteManySchema),
  deleteManyTasks,
);

router.delete("/:taskId", requirePermission("task:delete"), deleteTask);

module.exports = router;
