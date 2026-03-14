const { getAuth } = require("@clerk/express");
const { getUserIdUsingClerkId } = require("../../services/auth/user.service");
const { updateFilesById } = require("../../services/task.files.service");
const taskService = require("../../services/tasks.service");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sendSuccess = (res, data, statusCode = 200, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

// ─── Create ──────────────────────────────────────────────────────────────────

const createTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskData = req.validatedData;
    const task = await taskService.createTask(taskData, userId);

    if (taskData.attachedFilesId?.length > 0) {
      await updateFilesById(taskData.attachedFilesId);
    }

    sendSuccess(res, task, 201, "Task created successfully");
  } catch (err) {
    next(err);
  }
};

// ─── Read ─────────────────────────────────────────────────────────────────────

const getTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id);

    const task = await taskService.getTaskById(taskId, userId);

    sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
};

const getProjectTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.projectId);
    console.log("userid", "projectid", userId, projectId);
    const result = await taskService.getTasksByProject(
      projectId,
      userId,
      req.query,
    );

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

const getAssigneeTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const assigneeId = parseInt(req.params.userId);
    const workspaceId = parseInt(req.params.workspaceId);

    const tasks = await taskService.getTasksByAssignee(
      assigneeId,
      workspaceId,
      userId,
      req.query,
    );

    sendSuccess(res, tasks);
  } catch (err) {
    next(err);
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

const updateTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id);

    const task = await taskService.updateTask(
      taskId,
      userId,
      req.validatedData,
    );

    sendSuccess(res, task, 200, "Task updated successfully");
  } catch (err) {
    next(err);
  }
};

const updateTaskState = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id);
    const { state } = req.body;

    const task = await taskService.updateTaskState(taskId, userId, state);

    sendSuccess(res, task, 200, "Task state updated");
  } catch (err) {
    next(err);
  }
};

const updateTaskPriority = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id);
    const { priority } = req.body;

    const task = await taskService.updateTaskPriority(taskId, userId, priority);

    sendSuccess(res, task, 200, "Task priority updated");
  } catch (err) {
    next(err);
  }
};

const addChecklistItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id);

    const task = await taskService.addChecklistItem(taskId, userId, req.body);

    sendSuccess(res, task, 201, "Checklist item added");
  } catch (err) {
    next(err);
  }
};

const updateChecklistItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);

    const task = await taskService.updateChecklistItem(
      taskId,
      userId,
      itemId,
      req.body,
    );

    sendSuccess(res, task, 200, "Checklist item updated");
  } catch (err) {
    next(err);
  }
};

const removeChecklistItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);

    const task = await taskService.removeChecklistItem(taskId, userId, itemId);

    sendSuccess(res, task, 200, "Checklist item removed");
  } catch (err) {
    next(err);
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id);

    await taskService.deleteTask(taskId, userId);

    sendSuccess(res, null, 200, "Task deleted successfully");
  } catch (err) {
    next(err);
  }
};

const deleteManyTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const workspaceId = parseInt(req.params.workspaceId);
    const { taskIds } = req.body;

    await taskService.deleteManyTasks(taskIds, userId, workspaceId);

    sendSuccess(res, null, 200, "Tasks deleted successfully");
  } catch (err) {
    next(err);
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Create
  createTask,
  // Read
  getTask,
  getProjectTasks,
  getAssigneeTasks,
  // Update
  updateTask,
  updateTaskState,
  updateTaskPriority,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
  // Delete
  deleteTask,
  deleteManyTasks,
};
