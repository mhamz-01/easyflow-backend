"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("workspaceMembers", {
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
        type: Sequelize.STRING, // Clerk user ID
        allowNull: false,
      },

      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "member", // admin | member
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

    // Prevent duplicate user in same workspace
    await queryInterface.addIndex(
      "workspaceMembers",
      ["workspaceId", "userId"],
      {
        unique: true,
      }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("workspaceMembers");
  },
};
