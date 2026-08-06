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
const { requirePermission } = require("../middlewares/requirePermission");

const router = express.Router();

// All routes

// GET routes
router.get(WORKSPACE_API.CHECK, checkUserWorkspace);
router.get(WORKSPACE_API.GET_USER_WORKSPACES, getUserWorkspaces);
router.get(WORKSPACE_API.GET_SINGLE_WORKSPACE, getSingleWorkspace);
router.get(
  WORKSPACE_API.LIST_INVITES,
  requirePermission("invite:manage"),
  getWorkspaceInvites,
);
router.get(WORKSPACE_API.GET_WORKSPACE_MEMBERS, getWorkspaceMembers);
// Not permission-gated: this lists the caller's own pending invites by
// their account email, before they're a member of anything.
router.get(
  WORKSPACE_API.GET_USER_WORKSPACE_INVITES,
  getUserWorkspaceInvitesByEmail,
);

// POST routes
router.post(WORKSPACE_API.CREATE, createWorkspace);
router.post(
  WORKSPACE_API.CREATE_INVITE,
  requirePermission("invite:manage"),
  createInvite,
);
// Not permission-gated: the invitee isn't a workspace member yet — accept
// authorizes itself by matching the invite's email to the caller's account.
router.post(WORKSPACE_API.ACCEPT_INVITE, acceptInvite);
router.post(
  WORKSPACE_API.ADD_USER,
  requirePermission("invite:manage"),
  addExistingUser,
);

// PUT routes
router.put(WORKSPACE_API.UPDATE_WORKSPACE_NAME, updateWorkspaceName);

// DELETE routes
router.delete(WORKSPACE_API.DELETE_WORKSPACE, deleteWorkspace);
router.delete(WORKSPACE_API.DELETE_INVITE, deleteInvite);

// export router
module.exports = router;
