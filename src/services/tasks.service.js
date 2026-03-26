const { Op } = require("sequelize");
const { Task, User, Project, File } = require("../database/models");
const { AppError } = require("../utils/AppError");

// ─── Reusable include config ──────────────────────────────────────────────────
const TASK_INCLUDES = [
  {
    model: User,
    as: "creator",
    attributes: ["id", "username", "email"],
  },
  {
    model: User,
    as: "assignees",
    attributes: ["id", "username", "email"],
    through: { attributes: [] }, // hide junction table
  },
  {
    model: File,
    as: "attachments",
    // attributes: [
    //   "id",
    //   "originalName",
    //   "url",
    //   "mimeType",
    //   "size",
    //   "previewUrl",
    //   "createdAt",
    // ],
  },
  {
    model: Project,
    as: "project",
    attributes: ["id", "name"],
  },
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

  if (!task) {
    const err = new Error("Task not found");
    err.status = 404;
    throw err;
  }

  return task;
};

const createTask = async ({
  workspaceId,
  createdBy,
  assigneeIds = [],
  ...fields
}) => {
  const task = await Task.create({ workspaceId, createdBy, ...fields });

  if (assigneeIds.length > 0) {
    await task.setAssignees(assigneeIds);
  }

  return getTaskById(task.id, workspaceId);
};

const updateTask = async (taskId, workspaceId, { assigneeIds, ...fields }) => {
  const task = await getTaskById(taskId, workspaceId); // throws 404 if not found

  await task.update(fields);

  if (assigneeIds !== undefined) {
    await task.setAssignees(assigneeIds);
  }

  return getTaskById(taskId, workspaceId);
};

const deleteTask = async (taskId, workspaceId) => {
  const task = await getTaskById(taskId, workspaceId); // throws 404 if not found
  await task.destroy();
};

const updateChecklist = async (taskId, workspaceId, checklist) => {
  const task = await getTaskById(taskId, workspaceId);
  await task.update({ checklist });
  return task.checklist;
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateChecklist,
};
