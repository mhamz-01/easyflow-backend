const express = require("express");
const {
  createWorkspace,
  checkUserWorkspace,
  getUserWorkspaces,
  getSingleWorkspace,
  updateWorkspaceName,
  deleteWorkspace,
} = require("../controllers/workspace");
const { WORKSPACE_API } = require("../constants/workspace.api");

const router = express.Router();

// All routes

// GET routes
router.get(WORKSPACE_API.CHECK, checkUserWorkspace);
router.get(WORKSPACE_API.GET_USER_WORKSPACES, getUserWorkspaces);
router.get(WORKSPACE_API.GET_SINGLE_WORKSPACE, getSingleWorkspace);

// POST routes
router.post(WORKSPACE_API.CREATE, createWorkspace);

// PUT routes
router.put(WORKSPACE_API.UPDATE_WORKSPACE_NAME, updateWorkspaceName);

// DELETE routes
router.delete(WORKSPACE_API.DELETE_WORKSPACE, deleteWorkspace);

// export router
module.exports = router;
