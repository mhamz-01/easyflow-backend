"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Workspaces", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      workspaceSlug: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      workspaceName: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      notes: {
        type: Sequelize.INTEGER,
        references: {
          model: "StickyNotes",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      recentActivity: {
        type: Sequelize.INTEGER,
        references: {
          model: "RecentActivities",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      members: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },

      projects: {
        type: Sequelize.INTEGER,
        references: {
          model: "Projects",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      admin: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Workspaces");
  },
};
