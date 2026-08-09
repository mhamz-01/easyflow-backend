"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("chatReadStates", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "workspaces",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      // null = General channel, matches chatMessages.projectId's convention.
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Projects",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      // The highest chatMessages.id this user has seen in this channel.
      // Plain integer, not an FK — a read cursor should survive the message
      // it pointed at being (soft-)deleted, same reasoning as the
      // denormalized attachment snapshot on chatMessages itself.
      lastReadMessageId: {
        type: Sequelize.INTEGER,
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

    // One read-cursor row per (user, channel) — upserted on every "mark
    // read". Postgres unique indexes treat NULL as distinct from itself, so
    // a single (userId, workspaceId, projectId) unique index would let a
    // user accumulate multiple General-channel rows (projectId IS NULL).
    // Two partial unique indexes instead: one for project channels, one
    // for General.
    await queryInterface.addIndex("chatReadStates", ["userId", "workspaceId", "projectId"], {
      unique: true,
      name: "chat_read_states_user_workspace_project_unique",
      where: { projectId: { [Sequelize.Op.ne]: null } },
    });
    await queryInterface.addIndex("chatReadStates", ["userId", "workspaceId"], {
      unique: true,
      name: "chat_read_states_user_workspace_general_unique",
      where: { projectId: null },
    });

    // Unread-summary lookup is "give me every read-cursor this user has in
    // this workspace" — covered by the two indexes above already (both
    // lead with userId, workspaceId), no separate index needed.
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("chatReadStates");
  },
};
