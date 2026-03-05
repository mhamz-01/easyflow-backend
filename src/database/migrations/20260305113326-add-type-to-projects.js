"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Projects", "type", {
      type: Sequelize.ENUM("public", "private"),
      allowNull: false,
      defaultValue: "public",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Projects", "type");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Projects_type";',
    );
  },
};
