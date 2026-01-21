"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * STEP 1: Null invalid (non-numeric) values
     */
    await queryInterface.sequelize.query(`
      UPDATE "Projects"
      SET "workspaceId" = NULL
      WHERE "workspaceId" IS NOT NULL
      AND "workspaceId" !~ '^[0-9]+$'
    `);

    /**
     * STEP 2: Explicit cast STRING → INTEGER
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE "Projects"
      ALTER COLUMN "workspaceId"
      TYPE INTEGER
      USING "workspaceId"::INTEGER
    `);

    /**
     * STEP 3: Add foreign key constraint
     */
    await queryInterface.addConstraint("Projects", {
      fields: ["workspaceId"],
      type: "foreign key",
      name: "fk_projects_workspace",
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
     * Remove FK first
     */
    await queryInterface.removeConstraint("Projects", "fk_projects_workspace");

    /**
     * Revert INTEGER → STRING
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE "Projects"
      ALTER COLUMN "workspaceId"
      TYPE VARCHAR
    `);
  },
};
