"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("StickyNotes", "isEmpty", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true, // default to true since new notes may start empty
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("StickyNotes", "isEmpty");
  },
};
