"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Remove UNIQUE constraint from workspaceSlug
     */
    await queryInterface.removeConstraint(
      "Workspaces",
      "Workspaces_workspaceSlug_key"
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Restore UNIQUE constraint on rollback
     */
    await queryInterface.addConstraint("Workspaces", {
      fields: ["workspaceSlug"],
      type: "unique",
      name: "Workspaces_workspaceSlug_key",
    });
  },
};
