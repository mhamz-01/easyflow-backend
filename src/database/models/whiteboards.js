"use strict";

module.exports = (sequelize, DataTypes) => {
  const Whiteboard = sequelize.define(
    "Whiteboard",
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
        allowNull: false,
      },
      whiteboardName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Untitled",
      },
      assignees: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defaultAccess: {
        type: DataTypes.ENUM("view", "edit"),
        allowNull: false,
        defaultValue: "edit",
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {
          canvas: "",
          tasks: [],
          documents: [],
        },
      },
      lastEdited: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "whiteboards",
      freezeTableName: true,
      timestamps: true,
    }
  );

  Whiteboard.associate = (models) => {
    Whiteboard.belongsTo(models.Project, {
      foreignKey: "projectId",
    });
    Whiteboard.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });
    Whiteboard.hasMany(models.WhiteboardPermission, {
      foreignKey: "whiteboardId",
      as: "permissions",
    });
  };

  return Whiteboard;
};