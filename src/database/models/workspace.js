"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Workspace extends Model {
    /**
     * Define model associations
     */
    static associate(models) {
      // Workspace → Projects
      Workspace.hasMany(models.Project, {
        foreignKey: "workspaceId",
        onDelete: "CASCADE",
      });

      // Workspace → StickyNotes
      Workspace.hasMany(models.StickyNotes, {
        foreignKey: "workspaceId",
        onDelete: "CASCADE",
      });

      // Workspace → RecentActivities
      Workspace.hasMany(models.RecentActivities, {
        foreignKey: "workspaceId",
        onDelete: "CASCADE",
      });

      // Workspace => WorkspaceMembers
      Workspace.hasMany(models.WorkspaceMember, {
        foreignKey: "workspaceId",
      });
    }
  }

  Workspace.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      workspaceSlug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      workspaceName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      notes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      recentActivity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      members: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      projects: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      admin: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Workspace",
      tableName: "workspaces",
      timestamps: true,
      freezeTableName: true,
    }
  );

  return Workspace;
};
