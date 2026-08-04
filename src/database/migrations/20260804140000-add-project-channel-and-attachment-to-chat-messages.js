"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("chatMessages", "projectId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Projects",
        key: "id",
      },
      onDelete: "CASCADE",
    });

    // A message can now be a bare attachment card, so content is no longer
    // mandatory — enforced instead by the check constraint below (content
    // or attachment, at least one).
    await queryInterface.changeColumn("chatMessages", "content", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Snapshot of the shared task/document/whiteboard at share time
    // (denormalized, same principle as the author snapshot in the realtime
    // broadcast trigger) — shape: {type, id, title, projectId}.
    await queryInterface.addColumn("chatMessages", "attachment", {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    await queryInterface.addConstraint("chatMessages", {
      fields: ["content", "attachment"],
      type: "check",
      name: "chat_messages_content_or_attachment_check",
      where: Sequelize.literal(
        `("content" IS NOT NULL AND btrim("content") <> '') OR "attachment" IS NOT NULL`,
      ),
    });

    // Superseded by the composite index below — every read now filters by
    // projectId too (including IS NULL for General).
    await queryInterface.removeIndex("chatMessages", ["workspaceId", "id"]);
    await queryInterface.addIndex("chatMessages", ["workspaceId", "projectId", "id"], {
      name: "chat_messages_workspace_project_id_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("chatMessages", "chat_messages_workspace_project_id_idx");
    await queryInterface.addIndex("chatMessages", ["workspaceId", "id"]);
    await queryInterface.removeConstraint(
      "chatMessages",
      "chat_messages_content_or_attachment_check",
    );
    await queryInterface.removeColumn("chatMessages", "attachment");
    await queryInterface.changeColumn("chatMessages", "content", {
      type: Sequelize.TEXT,
      allowNull: false,
    });
    await queryInterface.removeColumn("chatMessages", "projectId");
  },
};
