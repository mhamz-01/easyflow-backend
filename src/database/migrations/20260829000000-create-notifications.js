"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("notifications", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "workspaces", key: "id" },
        onDelete: "CASCADE",
      },

      // Who this notification is for.
      recipientUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },

      // Who triggered it — nullable so a later actor account deletion
      // doesn't wipe out the recipient's notification history.
      actorUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },

      type: {
        type: Sequelize.ENUM("TASK_ASSIGNED", "TASK_STATUS_CHANGED", "TASK_DUE_CHANGED"),
        allowNull: false,
      },

      taskId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "tasks", key: "id" },
        onDelete: "CASCADE",
      },

      // Denormalized (not FK-constrained, same convention as
      // chatMessages.projectId) — a task has no direct URL, opening one
      // means navigating to this project's tasks page.
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      body: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },

      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // List query: "this user's notifications in this workspace, newest
    // first" — id doubles as the cursor column, same as chatMessages.
    await queryInterface.addIndex("notifications", ["recipientUserId", "workspaceId", "id"], {
      name: "notifications_recipient_workspace_id_idx",
    });
    // Unread-count / mark-all-read query.
    await queryInterface.addIndex("notifications", ["recipientUserId", "workspaceId", "isRead"], {
      name: "notifications_recipient_workspace_unread_idx",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("notifications");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
  },
};
