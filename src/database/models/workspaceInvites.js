"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class WorkspaceInvite extends Model {
    static associate(models) {
      WorkspaceInvite.belongsTo(models.Workspace, {
        foreignKey: "workspaceId",
      });
      WorkspaceInvite.belongsTo(models.User, {
        foreignKey: "createdBy",
        targetKey: "clerkId",
      });
    }
  }

  WorkspaceInvite.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      workspaceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Workspace",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true, // null = shareable link
      },
      role: {
        type: DataTypes.ENUM("owner", "admin", "member"),
        allowNull: false,
        defaultValue: "member",
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      acceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "User",
          key: "clerkId",
        },
      },
    },
    {
      sequelize,
      modelName: "WorkspaceInvite",
      tableName: "workspaceInvites",
      indexes: [{ fields: ["workspaceId"] }, { fields: ["email"] }],
    },
  );

  return WorkspaceInvite;
};
