"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add FK: delete sticky notes when workspace is deleted
     */
    await queryInterface.addConstraint("StickyNotes", {
      fields: ["workspaceID"],
      type: "foreign key",
      name: "fk_stickynotes_workspace",
      references: {
        table: "Workspaces",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Remove FK
     */
    await queryInterface.removeConstraint(
      "StickyNotes",
      "fk_stickynotes_workspace"
    );
  },
};
