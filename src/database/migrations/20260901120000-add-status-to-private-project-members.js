"use strict";

// Additive-only migration — every new column is nullable or defaulted, so the
// currently-deployed backend (which knows nothing about these columns) keeps
// working unchanged against this schema. No existing behavior changes: every
// pre-existing row defaults to status "active", identical to today's implicit
// "row exists = member" semantics.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("PrivateProjectMembers", "status", {
      type: Sequelize.ENUM("active", "removed"),
      allowNull: false,
      defaultValue: "active",
    });

    await queryInterface.addColumn("PrivateProjectMembers", "removedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("PrivateProjectMembers", "removedBy", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("PrivateProjectMembers", "invitedBy", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // No unique constraint has ever existed on (projectId, userId) — dedupe
    // before adding one, keeping the earliest row per pair.
    await queryInterface.sequelize.query(`
      DELETE FROM "PrivateProjectMembers" a
      USING "PrivateProjectMembers" b
      WHERE a.id > b.id
        AND a."projectId" = b."projectId"
        AND a."userId" = b."userId";
    `);

    // Composite index also covers plain "WHERE projectId = ?" lookups (leading
    // column), so no separate projectId-only index is added.
    await queryInterface.addConstraint("PrivateProjectMembers", {
      fields: ["projectId", "userId"],
      type: "unique",
      name: "private_project_members_project_user_unique",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeConstraint(
      "PrivateProjectMembers",
      "private_project_members_project_user_unique",
    );
    await queryInterface.removeColumn("PrivateProjectMembers", "invitedBy");
    await queryInterface.removeColumn("PrivateProjectMembers", "removedBy");
    await queryInterface.removeColumn("PrivateProjectMembers", "removedAt");
    await queryInterface.removeColumn("PrivateProjectMembers", "status");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_PrivateProjectMembers_status";',
    );
  },
};
