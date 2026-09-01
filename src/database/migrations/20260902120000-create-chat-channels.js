"use strict";

// Additive-only: chatMessages.channelId / chatReadStates.channelId are new,
// nullable columns. NULL keeps meaning exactly what "no channel row" means
// today (General, or a project's own default/main channel) — every existing
// row is unaffected until someone actually creates a sub-channel.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("chatChannels", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Projects",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
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

    await queryInterface.addConstraint("chatChannels", {
      fields: ["projectId", "name"],
      type: "unique",
      name: "chat_channels_project_name_unique",
    });

    await queryInterface.addColumn("chatMessages", "channelId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "chatChannels",
        key: "id",
      },
      onDelete: "CASCADE",
    });

    await queryInterface.addColumn("chatReadStates", "channelId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "chatChannels",
        key: "id",
      },
      onDelete: "CASCADE",
    });

    // Replace the two existing (projectId-only) partial unique indexes with
    // three that also account for channelId — see migration
    // 20260809120000-create-chat-read-states.js for why partial indexes are
    // needed at all (Postgres treats NULL as distinct from itself).
    await queryInterface.removeIndex(
      "chatReadStates",
      "chat_read_states_user_workspace_project_unique",
    );
    await queryInterface.removeIndex(
      "chatReadStates",
      "chat_read_states_user_workspace_general_unique",
    );

    await queryInterface.addIndex("chatReadStates", ["userId", "workspaceId"], {
      unique: true,
      name: "chat_read_states_general_unique",
      where: { projectId: null, channelId: null },
    });
    await queryInterface.addIndex("chatReadStates", ["userId", "workspaceId", "projectId"], {
      unique: true,
      name: "chat_read_states_project_main_unique",
      where: { projectId: { [Sequelize.Op.ne]: null }, channelId: null },
    });
    await queryInterface.addIndex("chatReadStates", ["userId", "workspaceId", "channelId"], {
      unique: true,
      name: "chat_read_states_sub_channel_unique",
      where: { channelId: { [Sequelize.Op.ne]: null } },
    });

    // chatMessages is already indexed on (workspaceId, projectId, id) —
    // sub-channel history is a further-filtered subset of that same index
    // (channelId narrows within a projectId that's already the leading
    // filter), so no separate index is needed for the common case. Add one
    // more for the "all sub-channels of a project" listing pattern (channel
    // rail unread aggregation groups by channelId within a project).
    await queryInterface.addIndex("chatMessages", ["channelId", "id"], {
      name: "chat_messages_channel_id_idx",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("chatMessages", "chat_messages_channel_id_idx");

    await queryInterface.removeIndex("chatReadStates", "chat_read_states_sub_channel_unique");
    await queryInterface.removeIndex("chatReadStates", "chat_read_states_project_main_unique");
    await queryInterface.removeIndex("chatReadStates", "chat_read_states_general_unique");

    await queryInterface.addIndex("chatReadStates", ["userId", "workspaceId", "projectId"], {
      unique: true,
      name: "chat_read_states_user_workspace_project_unique",
      where: { projectId: { [queryInterface.sequelize.Sequelize.Op.ne]: null } },
    });
    await queryInterface.addIndex("chatReadStates", ["userId", "workspaceId"], {
      unique: true,
      name: "chat_read_states_user_workspace_general_unique",
      where: { projectId: null },
    });

    await queryInterface.removeColumn("chatReadStates", "channelId");
    await queryInterface.removeColumn("chatMessages", "channelId");
    await queryInterface.dropTable("chatChannels");
  },
};
