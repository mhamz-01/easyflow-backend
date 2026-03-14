const { Op } = require("sequelize");
const db = require("../database/models");
const { AppError } = require("../utils/AppError");
const { getAuth } = require("@clerk/express");

// ─── Helpers ────────────────────────────────────────────────────────────────

const getTaskOrThrow = async (taskId) => {
  const task = await db.Task.findByPk(taskId, {
    include: [
      {
        model: db.User,
        as: "creator",
        attributes: ["id", "username", "email"],
      },
      {
        model: db.User,
        as: "assignees",
        attributes: ["id", "username", "email"],
        through: { attributes: [] },
      },
      { model: db.Project, as: "project", attributes: ["id", "name"] },
      {
        model: db.File,
        attributes: ["id", "originalName", "fileKey", "mimeType"],
      },
    ],
  });

  if (!task) throw new AppError("Task not found", 404);
  return task;
};

const verifyWorkspaceMembership = async (clerkId, workspaceId) => {
  const member = await db.WorkspaceMember.findOne({
    where: { userId: clerkId, workspaceId },
  });
  if (!member) throw new AppError("Access denied: not a workspace member", 403);
};

// ─── Create ─────────────────────────────────────────────────────────────────

const buildTaskPayload = (taskData, userId) => ({
  workspaceId: taskData.workspaceId,
  projectId: taskData.projectId ?? null,
  name: taskData.name,
  description: taskData.description ?? null,
  attachments: taskData.attachments ?? [],
  links: taskData.links ?? [],
  state: taskData.state ?? "todo",
  priority: taskData.priority ?? "medium",
  dueDate: taskData.dueDate ?? null,
  checklist: taskData.checklist ?? [],
  createdBy: userId,
});

const assignUsersToTask = async (task, assigneeIds, transaction) => {
  if (!assigneeIds?.length) return;
  await task.setAssignees(assigneeIds, { transaction });
};

const createTask = async (taskData, userId) => {
  const transaction = await db.sequelize.transaction();
  try {
    const task = await db.Task.create(buildTaskPayload(taskData, userId), {
      transaction,
    });
    await assignUsersToTask(task, taskData.assigneeIds, transaction);
    await transaction.commit();
    return getTaskOrThrow(task.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ─── Read ────────────────────────────────────────────────────────────────────

const getTaskById = async (taskId, userId) => {
  const task = await getTaskOrThrow(taskId);
  await verifyWorkspaceMembership(userId, task.workspaceId);
  return task;
};

const buildTaskFilters = (query) => {
  const where = { workspaceId: query.workspaceId };

  if (query.projectId) where.projectId = query.projectId;
  if (query.state) where.state = query.state;
  if (query.priority) where.priority = query.priority;
  if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
  if (query.dueDate) where.dueDate = query.dueDate;
  if (query.createdBy) where.createdBy = query.createdBy;

  return where;
};

const getTasksByProject = async (projectId) => {
  const project = await db.Project.findByPk(projectId);
  if (!project) throw new AppError("Project not found", 404);

  const tasks = await db.Task.findAll({
    where: { projectId },
    attributes: ["name", "priority", "state", "dueDate"],
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: db.User,
        as: "assignees",
        attributes: ["id", "username", "imageUrl"],
        through: { attributes: [] },
      },
    ],
  });
  return tasks;
};

const getTasksByAssignee = async (
  assigneeId,
  workspaceId,
  userId,
  query = {},
) => {
  await verifyWorkspaceMembership(userId, workspaceId);

  const assignee = await db.User.findByPk(assigneeId, {
    include: [
      {
        model: db.Task,
        as: "assignedTasks",
        where: buildTaskFilters({ ...query, workspaceId }),
        include: [
          {
            model: db.User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
          { model: db.Project, as: "project", attributes: ["id", "name"] },
        ],
        ...getPaginationOptions(query),
      },
    ],
  });

  if (!assignee) throw new AppError("User not found", 404);
  return assignee.assignedTasks ?? [];
};

// ─── Update ──────────────────────────────────────────────────────────────────

const UPDATABLE_FIELDS = [
  "name",
  "description",
  "state",
  "priority",
  "dueDate",
  "checklist",
  "links",
  "attachments",
  "projectId",
];

const pickUpdatableFields = (data) =>
  UPDATABLE_FIELDS.reduce((acc, field) => {
    if (data[field] !== undefined) acc[field] = data[field];
    return acc;
  }, {});

const updateTaskFields = async (task, data, transaction) => {
  const updates = pickUpdatableFields(data);
  if (Object.keys(updates).length) {
    await task.update(updates, { transaction });
  }
};

const updateTaskAssignees = async (task, assigneeIds, transaction) => {
  if (assigneeIds === undefined) return;
  await task.setAssignees(assigneeIds, { transaction });
};

const updateTask = async (taskId, userId, data) => {
  const task = await getTaskOrThrow(taskId);
  await verifyWorkspaceMembership(userId, task.workspaceId);

  const transaction = await db.sequelize.transaction();
  try {
    await updateTaskFields(task, data, transaction);
    await updateTaskAssignees(task, data.assigneeIds, transaction);
    await transaction.commit();
    return getTaskOrThrow(taskId);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const updateTaskState = async (taskId, userId, state) => {
  const task = await getTaskOrThrow(taskId);
  await verifyWorkspaceMembership(userId, task.workspaceId);
  await task.update({ state });
  return getTaskOrThrow(taskId);
};

const updateTaskPriority = async (taskId, userId, priority) => {
  const task = await getTaskOrThrow(taskId);
  await verifyWorkspaceMembership(userId, task.workspaceId);
  await task.update({ priority });
  return getTaskOrThrow(taskId);
};

const updateChecklistItem = async (taskId, userId, itemId, updates) => {
  const task = await getTaskOrThrow(taskId);
  await verifyWorkspaceMembership(userId, task.workspaceId);

  const checklist = task.checklist.map((item) =>
    item.id === itemId ? { ...item, ...updates } : item,
  );

  await task.update({ checklist });
  return getTaskOrThrow(taskId);
};

const addChecklistItem = async (taskId, userId, item) => {
  const task = await getTaskOrThrow(taskId);
  await verifyWorkspaceMembership(userId, task.workspaceId);

  const checklist = [
    ...(task.checklist ?? []),
    { id: Date.now(), ...item, completed: false },
  ];
  await task.update({ checklist });
  return getTaskOrThrow(taskId);
};

const removeChecklistItem = async (taskId, userId, itemId) => {
  const task = await getTaskOrThrow(taskId);
  await verifyWorkspaceMembership(userId, task.workspaceId);

  const checklist = task.checklist.filter((item) => item.id !== itemId);
  await task.update({ checklist });
  return getTaskOrThrow(taskId);
};

// ─── Delete ──────────────────────────────────────────────────────────────────

const deleteTask = async (taskId, userId) => {
  const task = await getTaskOrThrow(taskId);
  await verifyWorkspaceMembership(userId, task.workspaceId);

  const transaction = await db.sequelize.transaction();
  try {
    await task.setAssignees([], { transaction });
    await db.File.destroy({ where: { taskId }, transaction });
    await task.destroy({ transaction });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const deleteManyTasks = async (taskIds, userId, workspaceId) => {
  await verifyWorkspaceMembership(userId, workspaceId);

  const transaction = await db.sequelize.transaction();
  try {
    await db.sequelize.query(
      `DELETE FROM "taskAssignees" WHERE "taskId" IN (:taskIds)`,
      { replacements: { taskIds }, transaction },
    );
    await db.File.destroy({
      where: { taskId: { [Op.in]: taskIds } },
      transaction,
    });
    await db.Task.destroy({
      where: { id: { [Op.in]: taskIds }, workspaceId },
      transaction,
    });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  // Create
  createTask,
  // Read
  getTaskById,
  getTasksByProject,
  getTasksByAssignee,
  // Update
  updateTask,
  updateTaskState,
  updateTaskPriority,
  updateChecklistItem,
  addChecklistItem,
  removeChecklistItem,
  // Delete
  deleteTask,
  deleteManyTasks,
};
