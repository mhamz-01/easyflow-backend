"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("tasks", "attachedDocs", {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
      defaultValue: [],
    });
    await queryInterface.addColumn("tasks", "attachedWhiteboards", {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
      defaultValue: [],
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("tasks", "attachedDocs");
    await queryInterface.removeColumn("tasks", "attachedWhiteboards");
  },
};