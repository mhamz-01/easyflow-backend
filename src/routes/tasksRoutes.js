// routes/taskRoutes.js
const express = require("express");
const { validate } = require("../middlewares/validate");
const { createTaskSchema } = require("../controllers/tasks/schema");
const { createTask } = require("../controllers/tasks");
const router = express.Router();

// Create task
router.post("/", validate(createTaskSchema), createTask);

module.exports = router;
