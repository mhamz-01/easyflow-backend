"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Fix workspaceInvites.role enum: drop unused/dangerous "owner",
    // add "viewer" to match what the invite UI actually offers (admin/member/viewer).
    // Any existing 'owner' rows are remapped to 'admin' before the type swap so
    // the USING cast below can't fail on a value the new enum doesn't have.
    await queryInterface.sequelize.query(`
      UPDATE "workspaceInvites" SET "role" = 'admin' WHERE "role" = 'owner';
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "workspaceInvites" ALTER COLUMN "role" DROP DEFAULT;
      ALTER TYPE "enum_workspaceInvites_role" RENAME TO "enum_workspaceInvites_role_old";
      CREATE TYPE "enum_workspaceInvites_role" AS ENUM('admin', 'member', 'viewer');
      ALTER TABLE "workspaceInvites"
        ALTER COLUMN "role" TYPE "enum_workspaceInvites_role"
        USING "role"::text::"enum_workspaceInvites_role";
      ALTER TABLE "workspaceInvites" ALTER COLUMN "role" SET DEFAULT 'member';
      DROP TYPE "enum_workspaceInvites_role_old";
    `);

    // 2. Prevent duplicate pending invites for the same email in the same
    // workspace (concurrent createInvite calls previously had no DB-level guard).
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "workspaceInvites_workspaceId_email_pending_unique"
      ON "workspaceInvites" ("workspaceId", "email")
      WHERE "acceptedAt" IS NULL AND "email" IS NOT NULL;
    `);

    // 3. Prevent duplicate membership rows from concurrent accept/add calls.
    await queryInterface.addIndex("workspaceMembers", ["workspaceId", "userId"], {
      unique: true,
      name: "workspaceMembers_workspaceId_userId_unique",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(
      "workspaceMembers",
      "workspaceMembers_workspaceId_userId_unique",
    );
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "workspaceInvites_workspaceId_email_pending_unique";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "workspaceInvites" ALTER COLUMN "role" DROP DEFAULT;
      ALTER TYPE "enum_workspaceInvites_role" RENAME TO "enum_workspaceInvites_role_new";
      CREATE TYPE "enum_workspaceInvites_role" AS ENUM('owner', 'admin', 'member');
      ALTER TABLE "workspaceInvites"
        ALTER COLUMN "role" TYPE "enum_workspaceInvites_role"
        USING "role"::text::"enum_workspaceInvites_role";
      ALTER TABLE "workspaceInvites" ALTER COLUMN "role" SET DEFAULT 'member';
      DROP TYPE "enum_workspaceInvites_role_new";
    `);
  },
};
