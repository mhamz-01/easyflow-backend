const { Op } = require("sequelize");
const { Task, User, Project, File } = require("../database/models");
const { AppError } = require("../utils/AppError");
const { Document, Whiteboard } = require("../database/models");
const { ADMIN_ROLES } = require("./auth/workspaceMember");
const { canAccessTask } = require("./taskAccess.service");
const notificationService = require("./notification.service");
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

// Returns { where, andConditions } instead of folding everything into a
// single `where` object, since both the search filter and the privacy
// filter (added in getAllTasks) each need their own Op.or clause — and
// Sequelize can only hold one Op.or per object literal (it's the same
// Symbol key). Combining them via a shared `andConditions` array (→
// where[Op.and]) keeps both independently expressible.
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
  const andConditions = [];

  if (state) where.state = state;
  if (priority) where.priority = priority;
  if (projectId) where.projectId = projectId;

  if (search) {
    andConditions.push({
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ],
    });
  }

  if (dueBefore || dueAfter) {
    where.dueDate = {};
    if (dueBefore) where.dueDate[Op.lte] = dueBefore;
    if (dueAfter) where.dueDate[Op.gte] = dueAfter;
  }

  return { where, andConditions };
};

// ─── Service Methods ──────────────────────────────────────────────────────────

const getAllTasks = async ({
  workspaceId,
  filters = {},
  cursor = null, // last task id from previous page
  limit = 5,
  userId,
  role,
}) => {
  const { where: filterWhere, andConditions } = buildFilters(filters);
  const where = { workspaceId, ...filterWhere };

  // Private tasks are visible only to their creator and to admin/owner —
  // filtered at the query level (not post-fetch) so cursor pagination stays
  // correct.
  if (!ADMIN_ROLES.includes(role)) {
    andConditions.push({ [Op.or]: [{ isPrivate: false }, { createdBy: userId }] });
  }
  if (andConditions.length) where[Op.and] = andConditions;

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

const getTaskById = async (taskId, workspaceId, { userId, role } = {}) => {
  const task = await Task.findOne({
    where: { id: taskId, workspaceId },
    include: TASK_INCLUDES,
  });

  if (!task) throw new AppError("Task not found", 404);
  // 404 rather than 403 — same obscure-existence convention as the private
  // project/document/whiteboard checks elsewhere in this codebase.
  if (!canAccessTask({ task, userId, role })) {
    throw new AppError("Task not found", 404);
  }

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
    await notificationService.notifyTaskEvent({
      type: "TASK_ASSIGNED",
      task: { id: task.id, name: task.name, workspaceId: task.workspaceId, projectId: task.projectId },
      actorUserId: createdBy,
      recipientUserIds: assignees,
    });
  }

  // The creator always has access to what they just created, so no
  // separate role lookup is needed here.
  return getTaskById(task.id, workspaceId, { userId: createdBy });
};
const updateTask = async (
  taskId,
  workspaceId,
  { assigneeIds, ...fields },
  { userId, role } = {},
) => {
  const taskInstance = await Task.findOne({
    where: { id: taskId, workspaceId },
  });

  if (!taskInstance || !canAccessTask({ task: taskInstance, userId, role })) {
    throw new AppError("Task not found", 404);
  }

  // Snapshot before mutating — needed to diff against after .update()/
  // .setAssignees() so notifications only fire for what actually changed.
  const previousState = taskInstance.state;
  const previousDueDate = taskInstance.dueDate;
  const previousAssigneeIds = (await taskInstance.getAssignees({ attributes: ["id"] })).map(
    (a) => a.id,
  );

  await taskInstance.update(fields);

  let currentAssigneeIds = previousAssigneeIds;
  if (assigneeIds !== undefined) {
    await taskInstance.setAssignees(assigneeIds);
    currentAssigneeIds = assigneeIds;
  }

  const taskRef = {
    id: taskInstance.id,
    name: taskInstance.name,
    workspaceId: taskInstance.workspaceId,
    projectId: taskInstance.projectId,
  };

  if (assigneeIds !== undefined) {
    const newlyAssigned = assigneeIds.filter((id) => !previousAssigneeIds.includes(id));
    if (newlyAssigned.length > 0) {
      await notificationService.notifyTaskEvent({
        type: "TASK_ASSIGNED",
        task: taskRef,
        actorUserId: userId,
        recipientUserIds: newlyAssigned,
      });
    }
  }

  // Status/due-date changes go to whoever's currently assigned plus the
  // task's creator (the actor is excluded from their own notification
  // inside notifyTaskEvent regardless of which of these groups they're in).
  const statusOrDueRecipients = [...currentAssigneeIds, taskInstance.createdBy];

  if (fields.state !== undefined && fields.state !== previousState) {
    await notificationService.notifyTaskEvent({
      type: "TASK_STATUS_CHANGED",
      task: taskRef,
      actorUserId: userId,
      recipientUserIds: statusOrDueRecipients,
      extra: { state: fields.state },
    });
  }

  if (fields.dueDate !== undefined && fields.dueDate !== previousDueDate) {
    await notificationService.notifyTaskEvent({
      type: "TASK_DUE_CHANGED",
      task: taskRef,
      actorUserId: userId,
      recipientUserIds: statusOrDueRecipients,
      extra: { dueDate: fields.dueDate },
    });
  }

  // ✅ return enriched response — access already verified above.
  return getTaskById(taskId, workspaceId, { userId, role });
};

const deleteTask = async (taskId, workspaceId, { userId, role } = {}) => {
  // ✅ fetch raw Sequelize instance
  const taskInstance = await Task.findOne({
    where: { id: taskId, workspaceId },
  });

  if (!taskInstance || !canAccessTask({ task: taskInstance, userId, role })) {
    throw new AppError("Task not found", 404);
  }
  await taskInstance.destroy();
};

const updateChecklist = async (taskId, workspaceId, checklist, { userId, role } = {}) => {
  const taskInstance = await Task.findOne({
    where: { id: taskId, workspaceId },
  });

  if (!taskInstance || !canAccessTask({ task: taskInstance, userId, role })) {
    throw new AppError("Task not found", 404);
  }
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
