"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * STEP 1: Null invalid (non-numeric) values
     */
    await queryInterface.sequelize.query(`
      UPDATE "StickyNotes"
      SET "workspaceID" = NULL
      WHERE "workspaceID" IS NOT NULL
      AND "workspaceID" !~ '^[0-9]+$'
    `);

    /**
     * STEP 2: Explicit cast using USING
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE "StickyNotes"
      ALTER COLUMN "workspaceID"
      TYPE INTEGER
      USING "workspaceID"::INTEGER
    `);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Revert back to STRING
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE "StickyNotes"
      ALTER COLUMN "workspaceID"
      TYPE VARCHAR
    `);
  },
};
