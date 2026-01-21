const express = require("express");
const {
  getProjectsByWorkspaceSlug,
  createProject,
  deleteProject,
} = require("../controllers/project");
const router = express.Router();

// GET /projects/workspace/:workspaceId
router.get("/", getProjectsByWorkspaceSlug);

// POST Methods
router.post("/create", createProject);

// DELETE Methods
router.delete("/delete", deleteProject);

module.exports = router;
