"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("whiteboards", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      workspaceId: { type: Sequelize.INTEGER, allowNull: false },
      projectId: { type: Sequelize.INTEGER, allowNull: false },
      whiteboardName: { type: Sequelize.STRING, allowNull: false, defaultValue: "Untitled" },
      assignees: { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: true },
      createdBy: { type: Sequelize.INTEGER, allowNull: false },
      createdDate: { type: Sequelize.DATE, allowNull: false },
      isPrivate: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      content: { type: Sequelize.JSONB, allowNull: true, defaultValue: { canvas: "", tasks: [], documents: [] } },
      lastEdited: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("whiteboards");
  },
};