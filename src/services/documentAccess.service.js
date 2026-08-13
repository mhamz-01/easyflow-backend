const { DocumentPermission } = require("../database/models");
const { ADMIN_ROLES } = require("./auth/workspaceMember");

// Resolves what a specific user can do with a public document: admin/owner
// always wins (unconditional — no override can touch them), then an
// admin-granted per-user override on this specific user wins if one exists
// (this is what lets an admin explicitly restrict even the doc's own
// creator down to view/none), then the document's own creator gets edit by
// default (so setting `defaultAccess: 'view'` restricts everyone else
// without locking the creator out of their own doc unless an admin has
// deliberately overridden them), then the document's own default as the
// final fallback for everyone else.
// Callers must already know the document is not private and must pass the
// user's already-looked-up workspace role.
const resolveDocumentAccess = async ({ document, userId, role }) => {
  if (ADMIN_ROLES.includes(role)) return "edit";

  const override = await DocumentPermission.findOne({
    where: { documentId: document.id, userId },
    attributes: ["accessLevel"],
  });
  if (override) return override.accessLevel;

  if (document.createdBy === userId) return "edit";

  return document.defaultAccess;
};

// Batch version for list endpoints — resolves access for every public doc in
// one extra query instead of N. Private docs are left untouched (returned
// as-is; that visibility rule is a separate, unrelated concern).
const filterDocsByAccess = async ({ docs, userId, role }) => {
  if (ADMIN_ROLES.includes(role)) return docs;

  const publicDocs = docs.filter((doc) => !doc.isPrivate);
  const privateDocs = docs.filter((doc) => doc.isPrivate);

  const overrides = publicDocs.length
    ? await DocumentPermission.findAll({
        where: { documentId: publicDocs.map((doc) => doc.id), userId },
        attributes: ["documentId", "accessLevel"],
      })
    : [];
  const overrideMap = new Map(overrides.map((o) => [o.documentId, o.accessLevel]));

  const visiblePublicDocs = publicDocs.filter((doc) => {
    const override = overrideMap.get(doc.id);
    if (override) return override !== "none";
    if (doc.createdBy === userId) return true;
    return doc.defaultAccess !== "none";
  });

  return [...privateDocs, ...visiblePublicDocs];
};

module.exports = { resolveDocumentAccess, filterDocsByAccess, ADMIN_ROLES };
