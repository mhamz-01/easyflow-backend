"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class WorkspaceMember extends Model {
    static associate(models) {
      WorkspaceMember.belongsTo(models.Workspace, {
        foreignKey: "workspaceId",
        onDelete: "CASCADE",
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
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "member",
      },
    },
    {
      sequelize,
      modelName: "WorkspaceMember",
      tableName: "workspaceMembers",
    }
  );

  return WorkspaceMember;
};
