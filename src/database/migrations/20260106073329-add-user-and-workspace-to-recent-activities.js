"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("RecentActivities", "userId", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn("RecentActivities", "workspaceId", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("RecentActivities", "userId");
    await queryInterface.removeColumn("RecentActivities", "workspaceId");
  },
};
