const express = require("express");
const {
  getProjectsByWorkspaceSlug,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/project");
const {
  getProjectMembers,
  addMember,
  removeMember,
  leaveProject,
} = require("../controllers/project/members");
const { requirePermission } = require("../middlewares/requirePermission");
const { requireProjectAccess } = require("../middlewares/requireProjectAccess");
const router = express.Router();

// GET /projects/workspace/:workspaceId
router.get("/", requirePermission("project:read"), getProjectsByWorkspaceSlug);

// POST Methods
router.post("/create", requirePermission("project:create"), createProject);

// DELETE Methods
router.delete(
  "/delete",
  requirePermission("project:delete"),
  requireProjectAccess((req) => req.query.projectId),
  deleteProject,
);

// PATCH Methods — currently used to flip public <-> private (and rename)
router.patch(
  "/:projectId",
  requirePermission("project:update"),
  requireProjectAccess(),
  updateProject,
);

// ─── Project membership ─────────────────────────────────────────────────────
router.get(
  "/:projectId/members",
  requirePermission("project:read"),
  requireProjectAccess(),
  getProjectMembers,
);
router.post(
  "/:projectId/members",
  requirePermission("project:manage-members"),
  requireProjectAccess(),
  addMember,
);
router.delete(
  "/:projectId/members/me",
  requirePermission("project:read"),
  requireProjectAccess(),
  leaveProject,
);
router.delete(
  "/:projectId/members/:userId",
  requirePermission("project:manage-members"),
  requireProjectAccess(),
  removeMember,
);

module.exports = router;
