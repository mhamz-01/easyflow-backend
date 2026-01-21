"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class RecentActivities extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RecentActivities.belongsTo(models.Workspace, {
        foreignKey: "workspaceId",
      });
    }
  }
  RecentActivities.init(
    {
      userId: DataTypes.STRING,
      workspaceId: DataTypes.INTEGER,
      title: DataTypes.STRING,
      type: DataTypes.ENUM("DOC", "WHITEBOARD", "TASK"),
      typeID: DataTypes.INTEGER,
      projectID: DataTypes.INTEGER,
      lastEditedBy: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "RecentActivities",
    }
  );
  return RecentActivities;
};
