"use strict";

module.exports = {
  async up() {
    // Constraint doesn't exist in Supabase
    return Promise.resolve();
  },

  async down(queryInterface) {
    await queryInterface.addConstraint("Workspaces", {
      fields: ["workspaceSlug"],
      type: "unique",
      name: "Workspaces_workspaceSlug_key",
    });
  },
};