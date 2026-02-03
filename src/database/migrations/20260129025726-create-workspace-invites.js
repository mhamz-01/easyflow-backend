"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("workspaceInvites", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "workspaces",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      email: {
        type: Sequelize.STRING,
        allowNull: true, // null = shareable invite link
      },

      role: {
        type: Sequelize.ENUM("owner", "admin", "member"),
        allowNull: false,
        defaultValue: "member",
      },

      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      acceptedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      createdBy: {
        type: Sequelize.STRING, // inviter userId (Clerk)
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("workspaceInvites", ["workspaceId"]);

    await queryInterface.addIndex("workspaceInvites", ["email"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("workspaceInvites");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_workspaceInvites_role";',
    );
  },
};
