"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // project hasOne workspace
      Project.belongsTo(models.Workspace, {
        foreignKey: "workspaceId",
      });
      Project.hasMany(models.Document, {
        foreignKey: "projectId",
        onDelete: "CASCADE",
      });

      // Project has many task
      Project.hasMany(models.Task, {
        foreignKey: "projectId",
        onDelete: "CASCADE",
      });
      Project.belongsToMany(models.User, {
        through: "PrivateProjectMembers",
        foreignKey: "projectId",
        as: "members",
      });
    }
  }
  Project.init(
    {
      name: DataTypes.STRING,
      workspaceId: DataTypes.INTEGER,
      type: {
        type: DataTypes.ENUM("public", "private"),
        allowNull: false,
        defaultValue: "public",
      },
      admin: DataTypes.STRING,
      lead: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Project",
    },
  );
  return Project;
};
