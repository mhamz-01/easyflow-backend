const { updateFilesById } = require("../../services/task.files.service");
const taskService = require("../../services/tasks.service");
const { sendSuccess } = require("../../utils");

const getTasks = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const {
      cursor,
      limit,
      state,
      priority,
      projectId,
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
        projectId,
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
    const { workspaceId, taskId } = req.params;
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
  try {
    const { workspaceId } = req.params;
    const createdBy = req.user.id; // from auth middleware
    const taskData = req.body;
    const task = await taskService.createTask({
      workspaceId: parseInt(workspaceId),
      createdBy,
      ...taskData,
    });

    if (taskData.attachedFilesId?.length > 0) {
      await updateFilesById(taskData.attachedFilesId);
    }

    sendSuccess(res, task, 201, "Task created successfully");
  } catch (err) {
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
const deleteTask = async (req, res, next) => {
  try {
    const { workspaceId, taskId } = req.params;
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
