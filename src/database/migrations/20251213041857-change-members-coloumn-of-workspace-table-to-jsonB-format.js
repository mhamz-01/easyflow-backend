"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE "Workspaces" 
         ALTER COLUMN "members" TYPE JSONB USING to_jsonb("members")`,
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE "Workspaces" 
         ALTER COLUMN "members" TYPE TEXT[] USING ARRAY(SELECT jsonb_array_elements_text("members"))`,
        { transaction }
      );
    });
  },
};
