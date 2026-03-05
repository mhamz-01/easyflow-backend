"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Drop the default value first
    await queryInterface.sequelize.query(
      `ALTER TABLE "workspaceMembers" ALTER COLUMN "role" DROP DEFAULT;`,
    );

    // Step 2: Change to STRING temporarily (removes old ENUM constraint)
    await queryInterface.sequelize.query(
      `ALTER TABLE "workspaceMembers" ALTER COLUMN "role" TYPE VARCHAR(255);`,
    );

    // Step 3: Drop the old ENUM type
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_workspaceMembers_role";`,
    );

    // Step 4: Create the new ENUM type with 'viewer' included
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_workspaceMembers_role" AS ENUM('owner', 'admin', 'member', 'viewer');`,
    );

    // Step 5: Cast the column back to the new ENUM type
    await queryInterface.sequelize.query(
      `ALTER TABLE "workspaceMembers" ALTER COLUMN "role" TYPE "enum_workspaceMembers_role" USING "role"::"enum_workspaceMembers_role";`,
    );

    // Step 6: Restore the default value
    await queryInterface.sequelize.query(
      `ALTER TABLE "workspaceMembers" ALTER COLUMN "role" SET DEFAULT 'member'::"enum_workspaceMembers_role";`,
    );
  },

  async down(queryInterface, Sequelize) {
    // Step 1: Revert any 'viewer' roles to 'member'
    await queryInterface.sequelize.query(
      `UPDATE "workspaceMembers" SET role = 'member' WHERE role = 'viewer';`,
    );

    // Step 2: Drop the default
    await queryInterface.sequelize.query(
      `ALTER TABLE "workspaceMembers" ALTER COLUMN "role" DROP DEFAULT;`,
    );

    // Step 3: Change to VARCHAR temporarily
    await queryInterface.sequelize.query(
      `ALTER TABLE "workspaceMembers" ALTER COLUMN "role" TYPE VARCHAR(255);`,
    );

    // Step 4: Drop the updated ENUM type
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_workspaceMembers_role";`,
    );

    // Step 5: Recreate original ENUM type (without 'viewer')
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_workspaceMembers_role" AS ENUM('owner', 'admin', 'member');`,
    );

    // Step 6: Cast column back to original ENUM
    await queryInterface.sequelize.query(
      `ALTER TABLE "workspaceMembers" ALTER COLUMN "role" TYPE "enum_workspaceMembers_role" USING "role"::"enum_workspaceMembers_role";`,
    );

    // Step 7: Restore the default
    await queryInterface.sequelize.query(
      `ALTER TABLE "workspaceMembers" ALTER COLUMN "role" SET DEFAULT 'member'::"enum_workspaceMembers_role";`,
    );
  },
};
