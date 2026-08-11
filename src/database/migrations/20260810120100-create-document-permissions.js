"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("document_permissions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "documents",
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

    await queryInterface.addConstraint("document_permissions", {
      fields: ["documentId", "userId"],
      type: "unique",
      name: "document_permissions_document_user_unique",
    });

    await queryInterface.addIndex("document_permissions", ["documentId"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("document_permissions");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_document_permissions_accessLevel";'
    );
  },
};
