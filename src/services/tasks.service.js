// services/taskService.js
const {
  Task,
  User,
  Workspace,
  Project,
  sequelize,
} = require("../database/models");
const { NotFoundError, ValidationError } = require("../utils/AppError");

class TaskService {
  /**
   * Create a new task
   */
  async createTask(taskData, createdByUserId) {
    let taskId;
    const transaction = await sequelize.transaction();

    try {
      // Validate workspace exists and user has access
      const workspace = await Workspace.findByPk(taskData.workspaceId, {
        transaction,
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Validate project if provided
      if (taskData.projectId) {
        const project = await Project.findOne({
          where: {
            id: taskData.projectId,
            workspaceId: taskData.workspaceId,
          },
          transaction,
        });

        if (!project) {
          throw new NotFoundError(
            "Project not found or does not belong to this workspace",
          );
        }
      }

      // Validate assignees exist
      if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
        const users = await User.findAll({
          where: { id: taskData.assigneeIds },
          transaction,
        });

        if (users.length !== taskData.assigneeIds.length) {
          throw new ValidationError("One or more assignees not found");
        }
      }

      // Create task
      const task = await Task.create(
        {
          workspaceId: taskData.workspaceId,
          projectId: taskData.projectId,
          name: taskData.name,
          description: taskData.description,
          attachments: taskData.attachments,
          links: taskData.links,
          state: taskData.state,
          priority: taskData.priority,
          startDate: taskData.startDate,
          checklist: taskData.checklist,
          createdBy: createdByUserId,
        },
        { transaction },
      );

      taskId = task.id; // ✅ Store the ID

      // Assign users to task
      if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
        await task.setAssignees(taskData.assigneeIds, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return await this.getTaskById(taskId, createdByUserId);
  }

  /**
   * Get task by ID with associations
   */
  async getTaskById(taskId, userId) {
    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "email", "username"],
        },
        {
          model: User,
          as: "assignees",
          attributes: ["id", "email", "username"],
          through: { attributes: [] },
        },
        {
          model: Workspace,
          as: "workspace",
          attributes: ["id", "workspaceName"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    return task;
  }

  /**
   * Check if user has access to workspace
   */
  async validateWorkspaceAccess(workspaceId, userId) {
    // Implement your workspace access logic here
    // This is a placeholder
    const workspace = await Workspace.findByPk(workspaceId);
    return !!workspace;
  }
}

module.exports = new TaskService();
