const { getAuth } = require("@clerk/express");
const { getUserIdUsingClerkId } = require("../../services/user.service");
const taskService = require("../../services/tasks.service");
const { updateFilesById } = require("../../services/task.files.service");

const createTask = async (req, res, next) => {
  try {
    const taskData = req.validatedData;
    console.log("Validated data", taskData);
    // get clerkId
    const { userId: clerkId } = getAuth(req);

    const userId = await getUserIdUsingClerkId(clerkId);

    // get created task with transaction
    const task = await taskService.createTask(taskData, userId);

    // change uploaded files status if attachedFilesId exists
    if (taskData.attachedFilesId.length > 0) {
      await updateFilesById(taskData.attachedFilesId);
    }
    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    // Rollback transaction on error
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await taskService.getTaskById(parseInt(id), userId);

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTask,
};
