const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config(); // load .env variables

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false, // optional
  }
);

async function checkConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection successful!");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
}

module.exports = {
  sequelize,
  checkConnection,
};
