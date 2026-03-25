const express = require("express");
const { validate } = require("../middlewares/validate");
const { requirePermission } = require("../middlewares/requirePermission");

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
  validate(createTaskSchema),
  createTask,
);

// ─── Read ─────────────────────────────────────────────────────────────────────

router.get("/", requirePermission("task:read"), getTasks);

router.get("/:taskId", requirePermission("task:read"), getTask);

// ─── Update ───────────────────────────────────────────────────────────────────
router.patch(
  "/:taskId",
  requirePermission("task:update"),
  validate(updateTaskSchema),
  updateTask,
);

// ─── Checklist ────────────────────────────────────────────────────────────────
router.patch(
  "/:taskId/checklist/:itemId",
  requirePermission("task:update"),
  updateChecklist,
);

router.delete("/:taskId", requirePermission("task:delete"), deleteTask);

module.exports = router;
