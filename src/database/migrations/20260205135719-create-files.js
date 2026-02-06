"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("files", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      fileKey: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },

      originalName: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      mimeType: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      size: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("TEMP", "ATTACHED"),
        defaultValue: "TEMP",
      },

      taskId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "tasks",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      uploadedBy: {
        type: Sequelize.INTEGER, // Or UUID if you later decide Clerk userId is UUID
        allowNull: false,
      },

      workspaceId: {
        type: Sequelize.INTEGER, // Or UUID if your workspaces use UUID
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("files");
  },
};
