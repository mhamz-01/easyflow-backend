// models/file.js
"use strict";
module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define(
    "File",
    {
      fileKey: { type: DataTypes.TEXT, allowNull: false, unique: true },
      originalName: { type: DataTypes.STRING, allowNull: false },
      mimeType: { type: DataTypes.STRING, allowNull: false },
      size: { type: DataTypes.BIGINT, allowNull: false },
      status: {
        type: DataTypes.ENUM("TEMP", "ATTACHED"),
        defaultValue: "TEMP",
      },
      taskId: { type: DataTypes.INTEGER, allowNull: true },
      uploadedBy: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: "files" },
  );

  File.associate = function (models) {
    File.belongsTo(models.Task, { foreignKey: "taskId", onDelete: "CASCADE" });
  };

  return File;
};
