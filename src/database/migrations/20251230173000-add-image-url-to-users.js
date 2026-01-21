"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn("users", "imageUrl", "image_url");
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn("users", "image_url", "imageUrl");
  },
};
