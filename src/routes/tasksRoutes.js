const express = require("express");
const { validate } = require("../middlewares/validate");
const { requirePermission } = require("../middlewares/requirePermission");
const { requireProjectAccess } = require("../middlewares/requireProjectAccess");

const {
  createTaskSchema,
  updateTaskSchema,
} = require("../controllers/tasks/schema");

const {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getTasks,
  updateChecklist,
} = require("../controllers/tasks");

const router = express.Router({ mergeParams: true });

// ─── Create ───────────────────────────────────────────────────────────────────
router.post(
  "/",
  requirePermission("task:create"),
  requireProjectAccess(),
  validate(createTaskSchema),
  createTask,
);

// ─── Read ─────────────────────────────────────────────────────────────────────

router.get("/", requirePermission("task:read"), requireProjectAccess(), getTasks);

router.get("/:taskId", requirePermission("task:read"), requireProjectAccess(), getTask);

// ─── Update ───────────────────────────────────────────────────────────────────
router.patch(
  "/:taskId",
  requirePermission("task:update"),
  requireProjectAccess(),
  validate(updateTaskSchema),
  updateTask,
);

// ─── Checklist ────────────────────────────────────────────────────────────────
router.patch(
  "/:taskId/checklist/:itemId",
  requirePermission("task:update"),
  requireProjectAccess(),
  updateChecklist,
);

router.delete(
  "/:taskId",
  requirePermission("task:delete"),
  requireProjectAccess(),
  deleteTask,
);

module.exports = router;
