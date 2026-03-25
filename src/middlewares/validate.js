// middleware/validate.js
const { z } = require("zod");

const validate = (schema) => {
  return (req, res, next) => {
    try {
      console.log("body", req.body);
      const body = schema.parse(req.body);
      req.body = body;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error,
        });
      }
      next(error);
    }
  };
};

module.exports = { validate };
