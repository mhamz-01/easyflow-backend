"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn("Projects", "workspaceID", "workspaceId");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn("Projects", "workspaceId", "workspaceID");
  },
};
