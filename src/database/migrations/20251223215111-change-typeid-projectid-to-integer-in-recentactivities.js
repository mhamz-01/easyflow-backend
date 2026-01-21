"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * STEP 1: Null invalid values (safety)
     */
    await queryInterface.sequelize.query(`
      UPDATE "RecentActivities"
      SET "typeID" = NULL
      WHERE "typeID" IS NOT NULL
      AND "typeID" !~ '^[0-9]+$'
    `);

    await queryInterface.sequelize.query(`
      UPDATE "RecentActivities"
      SET "projectID" = NULL
      WHERE "projectID" IS NOT NULL
      AND "projectID" !~ '^[0-9]+$'
    `);

    /**
     * STEP 2: Explicit casting (Postgres requires USING)
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE "RecentActivities"
      ALTER COLUMN "typeID"
      TYPE INTEGER
      USING "typeID"::INTEGER
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "RecentActivities"
      ALTER COLUMN "projectID"
      TYPE INTEGER
      USING "projectID"::INTEGER
    `);

    /**
     * STEP 3: Add foreign key constraint
     */
    await queryInterface.addConstraint("RecentActivities", {
      fields: ["projectID"],
      type: "foreign key",
      name: "fk_recentactivities_project",
      references: {
        table: "Projects",
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
    await queryInterface.removeConstraint(
      "RecentActivities",
      "fk_recentactivities_project"
    );

    /**
     * Revert columns back to STRING
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE "RecentActivities"
      ALTER COLUMN "typeID"
      TYPE VARCHAR
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "RecentActivities"
      ALTER COLUMN "projectID"
      TYPE VARCHAR
    `);
  },
};
