"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.Workspace, { foreignKey: "workspaceId" });
      Notification.belongsTo(models.User, { foreignKey: "recipientUserId", as: "recipient" });
      Notification.belongsTo(models.User, { foreignKey: "actorUserId", as: "actor" });
      Notification.belongsTo(models.Task, { foreignKey: "taskId", onDelete: "CASCADE" });
    }
  }

  Notification.init(
    {
      workspaceId: DataTypes.INTEGER,
      recipientUserId: DataTypes.INTEGER,
      actorUserId: DataTypes.INTEGER,
      type: DataTypes.ENUM("TASK_ASSIGNED", "TASK_STATUS_CHANGED", "TASK_DUE_CHANGED"),
      taskId: DataTypes.INTEGER,
      projectId: DataTypes.INTEGER,
      title: DataTypes.STRING,
      body: DataTypes.STRING(500),
      isRead: DataTypes.BOOLEAN,
      readAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Notification",
      tableName: "notifications",
    },
  );

  return Notification;
};
