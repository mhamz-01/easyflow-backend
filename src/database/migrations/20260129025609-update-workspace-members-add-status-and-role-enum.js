"use strict";

module.exports = {
  up: async (queryInterface) => {
    // 1️⃣ Create ENUM type (safe, lowercase, quoted)
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_workspace_members_role"
      AS ENUM ('owner', 'admin', 'member');
    `);

    // 2️⃣ Drop default
    await queryInterface.sequelize.query(`
      ALTER TABLE "workspaceMembers"
      ALTER COLUMN "role" DROP DEFAULT;
    `);

    // 3️⃣ Convert column to ENUM (explicit cast)
    await queryInterface.sequelize.query(`
      ALTER TABLE "workspaceMembers"
      ALTER COLUMN "role"
      TYPE "enum_workspace_members_role"
      USING role::"enum_workspace_members_role";
    `);

    // 4️⃣ Restore default
    await queryInterface.sequelize.query(`
      ALTER TABLE "workspaceMembers"
      ALTER COLUMN "role" SET DEFAULT 'member';
    `);

    // 5️⃣ Add status column
    await queryInterface.addColumn("workspaceMembers", "status", {
      type: queryInterface.sequelize.Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  down: async (queryInterface) => {
    // 1️⃣ Remove status
    await queryInterface.removeColumn("workspaceMembers", "status");

    // 2️⃣ Drop default
    await queryInterface.sequelize.query(`
      ALTER TABLE "workspaceMembers"
      ALTER COLUMN "role" DROP DEFAULT;
    `);

    // 3️⃣ Convert ENUM back to string
    await queryInterface.sequelize.query(`
      ALTER TABLE "workspaceMembers"
      ALTER COLUMN "role"
      TYPE VARCHAR
      USING role::text;
    `);

    // 4️⃣ Restore default
    await queryInterface.sequelize.query(`
      ALTER TABLE "workspaceMembers"
      ALTER COLUMN "role" SET DEFAULT 'member';
    `);

    // 5️⃣ Drop ENUM
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_workspace_members_role";
    `);
  },
};
