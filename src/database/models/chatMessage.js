// models/ChatMessage.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ChatMessage = sequelize.define(
    "ChatMessage",
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "chatMessages",
      timestamps: true,
      paranoid: true, // soft delete: sets deletedAt instead of removing the row
      indexes: [{ fields: ["workspaceId", "id"] }],
    },
  );

  ChatMessage.associate = (models) => {
    ChatMessage.belongsTo(models.Workspace, {
      foreignKey: "workspaceId",
      as: "workspace",
    });
    ChatMessage.belongsTo(models.User, {
      foreignKey: "userId",
      as: "author",
    });
  };

  return ChatMessage;
};
