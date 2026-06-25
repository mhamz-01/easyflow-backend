const { Op } = require("sequelize");
const { Task, User, Project, File } = require("../database/models");
const { AppError } = require("../utils/AppError");
const { Document, Whiteboard } = require("../database/models");
// ─── Reusable include config ──────────────────────────────────────────────────
const TASK_INCLUDES = [
  {
    model: User,
    as: "creator",
    attributes: ["id", "username", "email", "imageUrl"],
  },
  {
    model: User,
    as: "assignees",
    attributes: ["id", "username", "email", "imageUrl"],
    through: { attributes: [] },
  },
  {
    model: File,
    as: "attachments",
  },
  {
    model: Project,
    as: "project",
    attributes: ["id", "name"],
  },
  // ✅ removed Document and Whiteboard includes — not associations
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildFilters = ({
  state,
  priority,
  projectId,
  assigneeId,
  search,
  dueBefore,
  dueAfter,
}) => {
  const where = {};

  if (state) where.state = state;
  if (priority) where.priority = priority;
  if (projectId) where.projectId = projectId;

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (dueBefore || dueAfter) {
    where.dueDate = {};
    if (dueBefore) where.dueDate[Op.lte] = dueBefore;
    if (dueAfter) where.dueDate[Op.gte] = dueAfter;
  }

  return where;
};

// ─── Service Methods ──────────────────────────────────────────────────────────

const getAllTasks = async ({
  workspaceId,
  filters = {},
  cursor = null, // last task id from previous page
  limit = 5,
}) => {
  const where = { workspaceId, ...buildFilters(filters) };

  // If cursor provided, only fetch tasks older than it
  if (cursor) {
    where.id = { [Op.lt]: cursor };
  }

  const include = filters.assigneeId
    ? TASK_INCLUDES.map((inc) =>
        inc.as === "assignees"
          ? { ...inc, where: { id: filters.assigneeId }, required: true }
          : inc,
      )
    : TASK_INCLUDES;

  const tasks = await Task.findAll({
    where,
    include,
    limit: limit + 1, // fetch one extra to know if more exist
    order: [["id", "DESC"]], // id is faster than createdAt for cursor pagination
    distinct: true,
  });

  const hasMore = tasks.length > limit;
  if (hasMore) tasks.pop(); // remove the extra item

  const nextCursor = hasMore ? tasks[tasks.length - 1].id : null;

  return {
    tasks,
    pagination: {
      nextCursor,
      hasMore,
      limit,
    },
  };
};

const getTaskById = async (taskId, workspaceId) => {
  const task = await Task.findOne({
    where: { id: taskId, workspaceId },
    include: TASK_INCLUDES,
  });

  if (!task) throw new AppError("Task not found", 404);

  const taskData = task.toJSON();

  // ✅ enrich with actual doc/whiteboard records
  taskData.documents =
    taskData.attachedDocs?.length > 0
      ? await Document.findAll({
          where: { id: taskData.attachedDocs },
          attributes: ["id", "documentName"],
        }).then((docs) => docs.map((d) => d.toJSON()))
      : [];

  taskData.whiteboards =
    taskData.attachedWhiteboards?.length > 0
      ? await Whiteboard.findAll({
          where: { id: taskData.attachedWhiteboards },
          attributes: ["id", "whiteboardName"], // ✅ was "name" — check your Whiteboard model
        }).then((wbs) => wbs.map((w) => w.toJSON()))
      : [];

  return taskData;
};

// Service
const createTask = async ({
  workspaceId,
  createdBy,
  assignees = [],
  attachedDocs = [], // ✅ explicitly extract
  attachedWhiteboards = [],
  ...rest
}) => {
  const task = await Task.create({
    workspaceId,
    createdBy,
    attachedDocs, // ✅ explicitly pass
    attachedWhiteboards, // ✅ explicitly pass
    ...rest,
  });

  if (Array.isArray(assignees) && assignees.length > 0) {
    await task.setAssignees(assignees);
  }

  return getTaskById(task.id, workspaceId);
};
const updateTask = async (taskId, workspaceId, { assigneeIds, ...fields }) => {
  const taskInstance = await Task.findOne({
    where: { id: taskId, workspaceId },
  });

  if (!taskInstance) throw new AppError("Task not found", 404);
  await taskInstance.update(fields);
  if (assigneeIds !== undefined) {
    await taskInstance.setAssignees(assigneeIds);
  }

  // ✅ return enriched response
  return getTaskById(taskId, workspaceId);
};

const deleteTask = async (taskId, workspaceId) => {
  // ✅ fetch raw Sequelize instance
  const taskInstance = await Task.findOne({
    where: { id: taskId, workspaceId },
  });

  if (!taskInstance) throw new AppError("Task not found", 404);
  await taskInstance.destroy();
};

const updateChecklist = async (taskId, workspaceId, checklist) => {
  const taskInstance = await Task.findOne({
    where: { id: taskId, workspaceId },
  });

  if (!taskInstance) throw new AppError("Task not found", 404);
  await taskInstance.update({ checklist });
  return taskInstance.checklist;
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateChecklist,
};
