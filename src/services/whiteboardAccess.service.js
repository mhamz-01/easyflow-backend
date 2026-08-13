const { WhiteboardPermission } = require("../database/models");
const { ADMIN_ROLES } = require("./auth/workspaceMember");

// Resolves what a specific user can do with a public whiteboard: admin/owner
// always wins (unconditional — no override can touch them), then an
// admin-granted per-user override on this specific user wins if one exists
// (this is what lets an admin explicitly restrict even the whiteboard's own
// creator down to view/none), then the whiteboard's own creator gets edit by
// default (so setting `defaultAccess: 'view'` restricts everyone else
// without locking the creator out of their own whiteboard unless an admin
// has deliberately overridden them), then the whiteboard's own default as
// the final fallback for everyone else.
// Callers must already know the whiteboard is not private and must pass the
// user's already-looked-up workspace role.
const resolveWhiteboardAccess = async ({ whiteboard, userId, role }) => {
  if (ADMIN_ROLES.includes(role)) return "edit";

  const override = await WhiteboardPermission.findOne({
    where: { whiteboardId: whiteboard.id, userId },
    attributes: ["accessLevel"],
  });
  if (override) return override.accessLevel;

  if (whiteboard.createdBy === userId) return "edit";

  return whiteboard.defaultAccess;
};

// Batch version for list endpoints — resolves access for every public
// whiteboard in one extra query instead of N. Private whiteboards are left
// untouched (returned as-is; that visibility rule is a separate, unrelated
// concern).
const filterWhiteboardsByAccess = async ({ whiteboards, userId, role }) => {
  if (ADMIN_ROLES.includes(role)) return whiteboards;

  const publicWhiteboards = whiteboards.filter((whiteboard) => !whiteboard.isPrivate);
  const privateWhiteboards = whiteboards.filter((whiteboard) => whiteboard.isPrivate);

  const overrides = publicWhiteboards.length
    ? await WhiteboardPermission.findAll({
        where: { whiteboardId: publicWhiteboards.map((whiteboard) => whiteboard.id), userId },
        attributes: ["whiteboardId", "accessLevel"],
      })
    : [];
  const overrideMap = new Map(overrides.map((o) => [o.whiteboardId, o.accessLevel]));

  const visiblePublicWhiteboards = publicWhiteboards.filter((whiteboard) => {
    const override = overrideMap.get(whiteboard.id);
    if (override) return override !== "none";
    if (whiteboard.createdBy === userId) return true;
    return whiteboard.defaultAccess !== "none";
  });

  return [...privateWhiteboards, ...visiblePublicWhiteboards];
};

module.exports = { resolveWhiteboardAccess, filterWhiteboardsByAccess, ADMIN_ROLES };
