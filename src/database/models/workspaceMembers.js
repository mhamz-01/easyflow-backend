"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class WorkspaceMember extends Model {
    static associate(models) {
      WorkspaceMember.belongsTo(models.Workspace, {
        foreignKey: "workspaceId",
        onDelete: "CASCADE",
      });
      WorkspaceMember.belongsTo(models.User, {
        foreignKey: "userId",
        targetKey: "clerkId",
      });
    }
  }

  WorkspaceMember.init(
    {
      workspaceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("owner", "admin", "member"),
        allowNull: false,
        defaultValue: "member",
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "WorkspaceMember",
      tableName: "workspaceMembers",
    },
  );

  return WorkspaceMember;
};
