const { sequelize } = require("../../database/models");
const { updateFilesById } = require("../../services/task.files.service");
const taskService = require("../../services/tasks.service");
const { sendSuccess } = require("../../utils");

const getTasks = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const { projectId } = req.params; // ✅ get from params, not query
    const {
      cursor,
      limit,
      state,
      priority,
      assigneeId,
      search,
      dueBefore,
      dueAfter,
    } = req.query;

    const result = await taskService.getAllTasks({
      workspaceId,
      filters: {
        state,
        priority,
        projectId, // ✅ now correctly passed
        assigneeId,
        search,
        dueBefore,
        dueAfter,
      },
      cursor: cursor ? parseInt(cursor) : null,
      limit: parseInt(limit) || 20,
    });

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// ─── GET /workspaces/:workspaceId/tasks/:taskId ───────────────────────────────
const getTask = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const { taskId } = req.params;
    console.log("workspaceId, taskdId", workspaceId, taskId);
    const task = await taskService.getTaskById(
      parseInt(taskId),
      parseInt(workspaceId),
    );
    sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
};

// ─── POST /workspaces/:workspaceId/tasks ──────────────────────────────────────
const createTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { workspaceId } = req.params;
    const createdBy = req.user.id;
    const taskData = req.body;

    const {
      assignees = [],
      attachedFilesId = [],
      attachedDocs = [],       
      attachedWhiteboards = [],
      documents,                // ✅ ignore — frontend legacy field
      ...rest
    } = taskData;

    const task = await taskService.createTask(
      {
        workspaceId: Number(workspaceId),
        createdBy,
        assignees,
        attachedDocs,       
        attachedWhiteboards,
        ...rest,
      },
      transaction,
    );

    if (attachedFilesId.length > 0) {
      await updateFilesById(attachedFilesId, task.id, transaction);
    }

    await transaction.commit();
    sendSuccess(res, task, 201, "Task created successfully");
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// ─── PATCH /workspaces/:workspaceId/tasks/:taskId ─────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const { taskId } = req.params;
    const task = await taskService.updateTask(
      parseInt(taskId),
      parseInt(workspaceId),
      req.body,
    );

    res.json(task);
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /workspaces/:workspaceId/tasks/:taskId ────────────────────────────
// ✅ Fix — get workspaceId from req, taskId from params (same pattern as updateTask)
const deleteTask = async (req, res, next) => {
  try {
    const { workspaceId } = req;        // ✅ from attachUser middleware
    const { taskId } = req.params;      // ✅ from URL
    await taskService.deleteTask(parseInt(taskId), parseInt(workspaceId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /workspaces/:workspaceId/tasks/:taskId/checklist ───────────────────
const updateChecklist = async (req, res, next) => {
  try {
    const { workspaceId, taskId } = req.params;
    const { checklist } = req.body;

    const updated = await taskService.updateChecklist(
      parseInt(taskId),
      parseInt(workspaceId),
      checklist,
    );

    res.json({ checklist: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateChecklist,
};
