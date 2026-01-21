"use strict";

module.exports = {
  up: async (queryInterface) => {
    /**
     * Convert TEXT -> JSONB safely
     * - Assumes existing content is valid JSON
     * - If invalid JSON exists, migration will fail
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE "StickyNotes"
      ALTER COLUMN "content"
      TYPE JSONB
      USING content::jsonb
    `);
  },

  down: async (queryInterface) => {
    /**
     * Convert JSONB -> TEXT
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE "StickyNotes"
      ALTER COLUMN "content"
      TYPE TEXT
      USING content::text
    `);
  },
};
