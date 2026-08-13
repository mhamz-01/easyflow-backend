"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("whiteboards", "defaultAccess", {
      type: Sequelize.ENUM("view", "edit"),
      allowNull: false,
      defaultValue: "edit",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("whiteboards", "defaultAccess");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_whiteboards_defaultAccess";'
    );
  },
};
