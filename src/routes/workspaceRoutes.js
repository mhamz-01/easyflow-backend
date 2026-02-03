const express = require("express");
const {
  createWorkspace,
  checkUserWorkspace,
  getUserWorkspaces,
  getSingleWorkspace,
  updateWorkspaceName,
  deleteWorkspace,
} = require("../controllers/workspace");

const {
  createInvite,
  acceptInvite,
  addExistingUser,
  getWorkspaceInvites,
  deleteInvite,
  getUserWorkspaceInvitesByEmail,
} = require("../controllers/workspace/invites");

const { WORKSPACE_API } = require("../constants/workspace.api");
const { getWorkspaceMembers } = require("../controllers/workspace/members");

const router = express.Router();

// All routes

// GET routes
router.get(WORKSPACE_API.CHECK, checkUserWorkspace);
router.get(WORKSPACE_API.GET_USER_WORKSPACES, getUserWorkspaces);
router.get(WORKSPACE_API.GET_SINGLE_WORKSPACE, getSingleWorkspace);
router.get(WORKSPACE_API.LIST_INVITES, getWorkspaceInvites);
router.get(WORKSPACE_API.GET_WORKSPACE_MEMBERS, getWorkspaceMembers);
router.get(
  WORKSPACE_API.GET_USER_WORKSPACE_INVITES,
  getUserWorkspaceInvitesByEmail,
);

// POST routes
router.post(WORKSPACE_API.CREATE, createWorkspace);
router.post(WORKSPACE_API.CREATE_INVITE, createInvite);
router.post(WORKSPACE_API.ACCEPT_INVITE, acceptInvite);
router.post(WORKSPACE_API.ADD_USER, addExistingUser);

// PUT routes
router.put(WORKSPACE_API.UPDATE_WORKSPACE_NAME, updateWorkspaceName);

// DELETE routes
router.delete(WORKSPACE_API.DELETE_WORKSPACE, deleteWorkspace);
router.delete(WORKSPACE_API.DELETE_INVITE, deleteInvite);

// export router
module.exports = router;
