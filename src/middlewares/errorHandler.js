// middleware/errorHandler.js
const { AppError } = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(err);

  // Sequelize validation errors
  if (err.name === "SequelizeValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new AppError(message.join(", "), 400);
  }

  // Sequelize unique constraint errors
  if (err.name === "SequelizeUniqueConstraintError") {
    error = new AppError("Duplicate field value entered", 400);
  }

  // Sequelize foreign key errors
  if (err.name === "SequelizeForeignKeyConstraintError") {
    error = new AppError("Invalid reference to related resource", 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
