"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("taskAssignees", {
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "tasks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add composite primary key
    await queryInterface.addConstraint("taskAssignees", {
      fields: ["taskId", "userId"],
      type: "primary key",
      name: "taskAssignees_pkey",
    });

    // Optional: Add indexes for better query performance
    await queryInterface.addIndex("taskAssignees", ["taskId"]);
    await queryInterface.addIndex("taskAssignees", ["userId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("taskAssignees");
  },
};
