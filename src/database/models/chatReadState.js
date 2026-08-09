// models/ChatReadState.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ChatReadState = sequelize.define(
    "ChatReadState",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      workspaceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // null = the workspace's General channel.
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Highest chatMessages.id this user has seen in this channel. Not an
      // FK on purpose — see migration comment.
      lastReadMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      // Real (partial) unique indexes are created by the migration —
      // Sequelize's model-level `indexes` option doesn't cleanly express a
      // partial-unique-with-WHERE the same way `queryInterface.addIndex`
      // does, and this codebase drives schema via migrations, not
      // `sync()`, so nothing here needs to redeclare them.
      tableName: "chatReadStates",
      timestamps: true,
    },
  );

  ChatReadState.associate = (models) => {
    ChatReadState.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    ChatReadState.belongsTo(models.Workspace, {
      foreignKey: "workspaceId",
      as: "workspace",
    });
    ChatReadState.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });
  };

  return ChatReadState;
};
