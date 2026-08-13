const { getAuth } = require("@clerk/express");
const { rolePermissions } = require("../constants/rolePermission");
const { getUserRole } = require("../controllers/authorization/controller");

function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      const { userId } = getAuth(req);
      const workspaceId = Number(req.headers["x-workspace-id"]);
      const role = await getUserRole(userId, workspaceId);

      if (!role) {
        return res.status(403).json({ message: "Not a workspace member" });
      }
      // Additive — lets downstream handlers do resource-level checks (e.g.
      // task privacy) without a second role lookup.
      req.workspaceRole = role;
      const permissions = rolePermissions[role] || [];
      if (!permissions.includes(permission) && !permissions.includes("*")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  requirePermission,
};
