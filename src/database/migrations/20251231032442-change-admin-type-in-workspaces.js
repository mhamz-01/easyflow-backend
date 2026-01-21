"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("workspaces", "admin", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("workspaces", "admin", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
