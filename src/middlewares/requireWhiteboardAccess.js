const { getAuth } = require("@clerk/express");
const { Whiteboard } = require("../database/models");
const { findWorkspaceMemberRole } = require("../services/auth/workspaceMember");
const { resolveWhiteboardAccess } = require("../services/whiteboardAccess.service");
const { assertProjectAccess } = require("../services/project.services");

// id can arrive as a route param (:id), a query param (GET/DELETE), or a
// body field (PUT/PATCH) depending on which whiteboards route this runs on.
const extractWhiteboardId = (req) => {
  const raw = req.params.id ?? req.query.id ?? req.body.id;
  return raw === undefined ? undefined : Number(raw);
};

// Public whiteboards only — private whiteboards (isPrivate: true) are left
// completely untouched by this check and simply pass through, since that
// visibility rule is a separate, pre-existing concern this feature doesn't
// change. For public whiteboards: workspace admin/owner always get "edit";
// everyone else is resolved against an admin-granted per-user override,
// falling back to the whiteboard's own default access level.
const requireWhiteboardAccess = (requiredLevel) => async (req, res, next) => {
  try {
    const whiteboardId = extractWhiteboardId(req);
    if (whiteboardId === undefined || Number.isNaN(whiteboardId)) {
      return res.status(400).json({ success: false, message: "Whiteboard id is required" });
    }

    const whiteboard = await Whiteboard.findByPk(whiteboardId, {
      attributes: ["id", "workspaceId", "projectId", "isPrivate", "defaultAccess", "createdBy"],
    });

    if (!whiteboard || whiteboard.workspaceId !== req.workspaceId) {
      return res.status(404).json({ success: false, message: "Whiteboard not found" });
    }

    const { userId: clerkId } = getAuth(req);
    const role = await findWorkspaceMemberRole(clerkId, req.workspaceId);
    if (!role) {
      return res.status(403).json({ success: false, message: "Not a workspace member" });
    }

    const canAccessProject = await assertProjectAccess({
      projectId: whiteboard.projectId,
      workspaceId: req.workspaceId,
      userId: req.user.id,
      workspaceRole: role,
    });
    if (!canAccessProject) {
      return res.status(404).json({ success: false, message: "Whiteboard not found" });
    }

    if (whiteboard.isPrivate) {
      return next();
    }

    const access = await resolveWhiteboardAccess({ whiteboard, userId: req.user.id, role });

    if (access === "none" || (requiredLevel === "edit" && access === "view")) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    req.whiteboardAccess = access;
    req.whiteboardRole = role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireWhiteboardAccess };
