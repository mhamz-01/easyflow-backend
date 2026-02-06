"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("files", "workspaceId");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("files", "workspaceId", {
      type: Sequelize.INTEGER, // Or UUID if needed later
      allowNull: false,
    });
  },
};
