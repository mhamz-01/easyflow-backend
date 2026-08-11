"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("documents", "defaultAccess", {
      type: Sequelize.ENUM("view", "edit"),
      allowNull: false,
      defaultValue: "edit",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("documents", "defaultAccess");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_documents_defaultAccess";'
    );
  },
};
