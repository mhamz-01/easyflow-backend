"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Docs/whiteboards listing: WHERE projectId = ? AND workspaceId = ?.
    // `documents` already has separate single-column indexes on each, which
    // Postgres can only combine via a bitmap AND of both — this composite
    // (leading with projectId, the more selective column and the one every
    // other single-doc/single-whiteboard lookup also filters on) lets it
    // satisfy the whole WHERE from one index instead.
    await queryInterface.addIndex("documents", ["projectId", "workspaceId"], {
      name: "documents_project_workspace_idx",
    });

    // `whiteboards` has no indexes at all beyond the primary key today, so
    // every listing/lookup query is a full table scan.
    await queryInterface.addIndex("whiteboards", ["projectId", "workspaceId"], {
      name: "whiteboards_project_workspace_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("documents", "documents_project_workspace_idx");
    await queryInterface.removeIndex("whiteboards", "whiteboards_project_workspace_idx");
  },
};
