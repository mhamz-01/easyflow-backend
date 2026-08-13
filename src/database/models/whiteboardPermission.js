"use strict";

module.exports = (sequelize, DataTypes) => {
  const WhiteboardPermission = sequelize.define(
    "WhiteboardPermission",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      whiteboardId: {
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
      tableName: "whiteboard_permissions",
      timestamps: true,
    }
  );

  WhiteboardPermission.associate = (models) => {
    WhiteboardPermission.belongsTo(models.Whiteboard, {
      foreignKey: "whiteboardId",
    });
    WhiteboardPermission.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    WhiteboardPermission.belongsTo(models.User, {
      foreignKey: "grantedBy",
      as: "grantedByUser",
    });
  };

  return WhiteboardPermission;
};
