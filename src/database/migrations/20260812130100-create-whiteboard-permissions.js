"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("whiteboard_permissions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      whiteboardId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "whiteboards",
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
      accessLevel: {
        type: Sequelize.ENUM("view", "edit", "none"),
        allowNull: false,
      },
      grantedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addConstraint("whiteboard_permissions", {
      fields: ["whiteboardId", "userId"],
      type: "unique",
      name: "whiteboard_permissions_whiteboard_user_unique",
    });

    await queryInterface.addIndex("whiteboard_permissions", ["whiteboardId"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("whiteboard_permissions");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_whiteboard_permissions_accessLevel";'
    );
  },
};
