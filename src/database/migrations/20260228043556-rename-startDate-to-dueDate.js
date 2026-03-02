"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      "tasks", // replace with your table name
      "startDate",
      "dueDate",
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn("tasks", "dueDate", "startDate");
  },
};
