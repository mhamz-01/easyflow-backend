"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("chatMessages", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      editedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      deletedAt: {
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

    // Chat history is always read newest-first for one workspace at a time,
    // and this index also drives keyset (cursor) pagination via id.
    await queryInterface.addIndex("chatMessages", ["workspaceId", "id"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("chatMessages");
  },
};
