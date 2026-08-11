"use strict";

module.exports = (sequelize, DataTypes) => {
  const DocumentPermission = sequelize.define(
    "DocumentPermission",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      documentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      accessLevel: {
        type: DataTypes.ENUM("view", "edit", "none"),
        allowNull: false,
      },
      grantedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "document_permissions",
      timestamps: true,
    }
  );

  DocumentPermission.associate = (models) => {
    DocumentPermission.belongsTo(models.Document, {
      foreignKey: "documentId",
    });
    DocumentPermission.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    DocumentPermission.belongsTo(models.User, {
      foreignKey: "grantedBy",
      as: "grantedByUser",
    });
  };

  return DocumentPermission;
};
