"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class StickyNotes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      StickyNotes.belongsTo(models.Workspace, {
        foreignKey: "workspaceId",
      });
    }
  }
  StickyNotes.init(
    {
      userId: DataTypes.STRING,
      workspaceId: DataTypes.INTEGER,
      content: DataTypes.JSONB,
      bgColor: DataTypes.STRING,
      isEmpty: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "StickyNotes",
    }
  );
  return StickyNotes;
};
