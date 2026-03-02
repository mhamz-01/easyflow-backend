"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("tasks", "dueDate", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("tasks", "dueDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
