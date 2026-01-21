"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("workspaces", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      workspaceSlug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      workspaceName: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      notes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      recentActivity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      members: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      projects: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      admin: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    await queryInterface.addIndex("workspaces", ["workspaceSlug"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("workspaces");
  },
};
