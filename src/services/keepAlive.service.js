const { sequelize } = require("../database/models");

// Supabase free-tier projects auto-pause after a period of no API activity.
// A trivial daily query keeps the project (and therefore chat) from pausing.
const pingDatabase = async () => {
  await sequelize.query("SELECT 1");
  return { pingedAt: new Date().toISOString() };
};

module.exports = { pingDatabase };
