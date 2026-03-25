"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("tasks", "attachments");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("tasks", "attachments", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
    });
  },
};
