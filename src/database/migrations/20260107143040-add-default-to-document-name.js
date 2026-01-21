"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("documents", "documentName", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "Untitled",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("documents", "documentName", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: null,
    });
  },
};
