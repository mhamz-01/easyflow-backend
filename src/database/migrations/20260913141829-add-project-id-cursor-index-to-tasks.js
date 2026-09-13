"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Tasks page list query: WHERE projectId = ? [AND ...] ORDER BY id DESC
    // LIMIT (cursor pagination). The existing single-column workspaceId/
    // projectId indexes let Postgres filter via one of them but still force
    // a separate sort step afterward. This composite lets it satisfy the
    // filter and the DESC order from a single index scan instead (a plain
    // ascending btree index supports an efficient backward scan for DESC).
    await queryInterface.addIndex("tasks", ["projectId", "id"], {
      name: "tasks_project_id_cursor_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("tasks", "tasks_project_id_cursor_idx");
  },
};
