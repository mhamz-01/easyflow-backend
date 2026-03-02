// services/taskService.js
const {
  Task,
  User,
  Workspace,
  Project,
  TaskAssignee,
  sequelize,
} = require("../database/models");
const { NotFoundError } = require("../utils/AppError");

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
          dueDate: taskData.dueDate,
          checklist: taskData.checklist,
          createdBy: createdByUserId,
        },
        { transaction },
      );

      console.log(taskData.assignees);
      // Assign users to the task
      if (taskData.assignees.length > 0) {
        const assignees = taskData.assignees.map((assigneeId) => ({
          taskId: task.id,
          userId: assigneeId,
        }));

        const Taskassignees = await TaskAssignee.bulkCreate(assignees, {
          transaction,
        });
        console.log("task assignees", Taskassignees);
      }

      taskId = task.id; // ✅ Store the ID

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
