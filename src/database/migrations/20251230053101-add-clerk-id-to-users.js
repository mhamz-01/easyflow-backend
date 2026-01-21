"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "clerkId", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true, // each user should have a unique Clerk ID
    });

    // Optional: add an index for faster lookups
    await queryInterface.addIndex("users", ["clerkId"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "clerkId");
  },
};
