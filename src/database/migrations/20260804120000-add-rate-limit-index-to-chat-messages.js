"use strict";

module.exports = {
  up: async (queryInterface) => {
    // Speeds up the per-send rate-limit check in chat.service.js
    // (COUNT of a user's recent messages in a workspace), which the
    // existing (workspaceId, id) index doesn't cover.
    await queryInterface.addIndex("chatMessages", ["workspaceId", "userId", "createdAt"], {
      name: "chat_messages_workspace_user_created_idx",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("chatMessages", "chat_messages_workspace_user_created_idx");
  },
};
