"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Projects", "members");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("Projects", "members", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
