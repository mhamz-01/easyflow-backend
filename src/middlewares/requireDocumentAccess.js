const { getAuth } = require("@clerk/express");
const { Document } = require("../database/models");
const { findWorkspaceMemberRole } = require("../services/auth/workspaceMember");
const { resolveDocumentAccess } = require("../services/documentAccess.service");

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
const requireDocumentAccess = (requiredLevel) => async (req, res, next) => {
  try {
    const docId = extractDocId(req);
    if (docId === undefined || Number.isNaN(docId)) {
      return res.status(400).json({ success: false, message: "Document id is required" });
    }

    const document = await Document.findByPk(docId, {
      attributes: ["id", "workspaceId", "isPrivate", "defaultAccess", "createdBy"],
    });

    if (!document || document.workspaceId !== req.workspaceId) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (document.isPrivate) {
      return next();
    }

    const { userId: clerkId } = getAuth(req);
    const role = await findWorkspaceMemberRole(clerkId, req.workspaceId);
    if (!role) {
      return res.status(403).json({ success: false, message: "Not a workspace member" });
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
