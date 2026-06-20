"use strict";

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    "Document",
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
      documentName: {
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
      content: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      lastEdited: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "documents",
      freezeTableName: true,
      timestamps: true,
    }
  );

  Document.associate = (models) => {
    Document.belongsTo(models.Project, {
      foreignKey: "projectId",
    });
    Document.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });
  };

  return Document;
};
