const dotenv = require("dotenv");
dotenv.config({ path: `${process.cwd()}/.env.${process.env.NODE_ENV || "development"}` });

const config = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
      connectTimeout: 60000, 
    },
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
      connectTimeout: 60000,
    },
    // Each Vercel serverless invocation can spin up its own connection pool,
    // so keep it small — Supabase's pooler (port 6543/pgbouncer) is already
    // handling connection multiplexing on its end.
    pool: {
      max: 2,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: false,
  },
};

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: `${process.cwd()}/.env.${process.env.NODE_ENV || "development"}` });
}

module.exports = config;