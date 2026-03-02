// models/Task.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Task = sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      workspaceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      attachments: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      links: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      state: {
        type: DataTypes.ENUM("todo", "in progress", "done"),
        allowNull: false,
        defaultValue: "todo",
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high"),
        allowNull: false,
        defaultValue: "medium",
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      dueDate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      checklist: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      tableName: "tasks",
      timestamps: true, // Adds createdAt and updatedAt
      underscored: false, // Keep camelCase everywhere
      indexes: [
        { fields: ["workspaceId"] },
        { fields: ["projectId"] },
        { fields: ["createdBy"] },
        { fields: ["state"] },
      ],
    },
  );

  // Define associations
  Task.associate = (models) => {
    Task.belongsTo(models.Workspace, {
      foreignKey: "workspaceId",
      as: "workspace",
    });

    Task.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });

    Task.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });

    Task.hasMany(models.File, {
      foreignKey: "taskId",
    });
    // Many-to-many with users (assignees)
    Task.belongsToMany(models.User, {
      through: "taskAssignees",
      foreignKey: "taskId",
      otherKey: "userId",
      as: "assignees",
    });
  };

  return Task;
};
