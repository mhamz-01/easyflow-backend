const { getAuth } = require("@clerk/express");
const { Document } = require("../database/models");
const { findWorkspaceMemberRole } = require("../services/auth/workspaceMember");
const { resolveDocumentAccess } = require("../services/documentAccess.service");
const { assertProjectAccess } = require("../services/project.services");

// id can arrive as a route param (:id), a query param (GET/DELETE), or a
// body field (PUT/PATCH) depending on which docs route this runs on.
const extractDocId = (req) => {
  const raw = req.params.id ?? req.query.id ?? req.body.id;
  return raw === undefined ? undefined : Number(raw);
};

// Public documents only — private documents (isPrivate: true) are left
// completely untouched by this check and simply pass through, since that
// visibility rule is a separate, pre-existing concern this feature doesn't
// change. For public documents: workspace admin/owner always get "edit";
// everyone else is resolved against an admin-granted per-user override,
// falling back to the document's own default access level.
// fullRow: true fetches every column instead of the trimmed access-check
// set, for routes whose controller needs the whole row (e.g. GET /single,
// which used to re-run Document.findByPk itself right after this middleware
// already loaded it). Stashed on req.document either way so a controller
// that only needs what's already here never has to query again.
const requireDocumentAccess = (requiredLevel, { fullRow = false } = {}) => async (req, res, next) => {
  try {
    const docId = extractDocId(req);
    if (docId === undefined || Number.isNaN(docId)) {
      return res.status(400).json({ success: false, message: "Document id is required" });
    }

    const document = await Document.findByPk(
      docId,
      fullRow
        ? undefined
        : { attributes: ["id", "workspaceId", "projectId", "isPrivate", "defaultAccess", "createdBy"] },
    );

    if (!document || document.workspaceId !== req.workspaceId) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const { userId: clerkId } = getAuth(req);
    const role = await findWorkspaceMemberRole(clerkId, req.workspaceId);
    if (!role) {
      return res.status(403).json({ success: false, message: "Not a workspace member" });
    }

    // Gate on the document's project before anything document-specific — a
    // private-project non-member gets no access to any document inside it,
    // regardless of the document's own isPrivate/defaultAccess settings.
    const canAccessProject = await assertProjectAccess({
      projectId: document.projectId,
      workspaceId: req.workspaceId,
      userId: req.user.id,
      workspaceRole: role,
    });
    if (!canAccessProject) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    req.document = document;

    if (document.isPrivate) {
      return next();
    }

    const access = await resolveDocumentAccess({ document, userId: req.user.id, role });

    if (access === "none" || (requiredLevel === "edit" && access === "view")) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    req.documentAccess = access;
    req.documentRole = role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireDocumentAccess };
