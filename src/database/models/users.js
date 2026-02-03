"use strict";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      muteNotifications: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      clerkId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
    },
  );

  User.associate = (models) => {
    User.hasMany(models.Document, {
      foreignKey: "createdBy",
    });
    User.hasMany(models.WorkspaceInvite, {
      foreignKey: "createdBy",
    });
    User.belongsToMany(models.Workspace, {
      through: models.WorkspaceMember,
      foreignKey: "userId",
      sourceKey: "clerkId",
      otherKey: "workspaceId",
    });
    User.hasMany(models.WorkspaceMember, {
      foreignKey: "userId",
    });
  };

  return User;
};
