// models/ChatChannel.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ChatChannel = sequelize.define(
    "ChatChannel",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "chatChannels",
      timestamps: true,
    },
  );

  ChatChannel.associate = (models) => {
    ChatChannel.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });
    ChatChannel.belongsTo(models.User, {
      foreignKey: "createdBy",
      as: "creator",
    });
    ChatChannel.hasMany(models.ChatMessage, {
      foreignKey: "channelId",
      onDelete: "CASCADE",
    });
  };

  return ChatChannel;
};
