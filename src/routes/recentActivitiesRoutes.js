const express = require("express");
const {
  createRecentActivity,
  getAllRecentActivities,
} = require("../controllers/recentActivities");

const router = express.Router();

// GET Method
router.get("/", getAllRecentActivities);

// POST Method
router.post("/create", createRecentActivity);

module.exports = router;
