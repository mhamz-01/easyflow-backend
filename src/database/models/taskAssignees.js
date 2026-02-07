"use strict";

module.exports = (sequelize, DataTypes) => {
  const TaskAssignee = sequelize.define(
    "TaskAssignee",
    {
      taskId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tasks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "taskAssignees",
      timestamps: true,
    },
  );

  TaskAssignee.associate = function (models) {
    // Optional: if you want to access Task or User directly from TaskAssignee
    TaskAssignee.belongsTo(models.Task, {
      foreignKey: "taskId",
      onDelete: "CASCADE",
    });
    TaskAssignee.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
  };

  // Remove default id primary key since we're using composite key
  TaskAssignee.removeAttribute("id");

  return TaskAssignee;
};
