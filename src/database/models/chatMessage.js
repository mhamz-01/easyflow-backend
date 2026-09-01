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
      // null = the workspace's General channel; set = that project's channel.
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // null = General (if projectId is also null) or the project's own
      // default/main channel (if projectId is set) — same convention as
      // projectId itself. Set = a named sub-channel within that project.
      channelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Nullable: a message can be a bare attachment card. At least one of
      // content/attachment is required — enforced by a DB check constraint
      // (see migration) and by the Zod schema on the way in.
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Snapshot of a shared task/document/whiteboard, denormalized at send
      // time: {type, id, title, projectId} — survives the source being
      // renamed or deleted later.
      attachment: {
        type: DataTypes.JSONB,
        allowNull: true,
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
      indexes: [
        { fields: ["workspaceId", "userId", "createdAt"] },
        { fields: ["workspaceId", "projectId", "id"] },
        { fields: ["channelId", "id"] },
      ],
    },
  );

  ChatMessage.associate = (models) => {
    ChatMessage.belongsTo(models.Workspace, {
      foreignKey: "workspaceId",
      as: "workspace",
    });
    ChatMessage.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });
    ChatMessage.belongsTo(models.ChatChannel, {
      foreignKey: "channelId",
      as: "channel",
    });
    ChatMessage.belongsTo(models.User, {
      foreignKey: "userId",
      as: "author",
    });
  };

  return ChatMessage;
};
