const { assertProjectAccess } = require("../services/project.services");

// Runs after requirePermission (so req.workspaceRole is already set).
// projectIdSource picks where to read the project id from — routes differ:
// tasks carry it in the URL (mergeParams), docs/whiteboards resolve it from
// the already-fetched resource. Returns 404 rather than 403 for a denied
// private project so a non-member can't tell it exists (same reasoning as
// requireChatChannelAccess).
const requireProjectAccess = (projectIdSource = (req) => req.params.projectId) =>
  async (req, res, next) => {
    try {
      const raw = await projectIdSource(req);
      if (raw === undefined || raw === null) return next();

      const projectId = Number(raw);
      if (Number.isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "Invalid project id" });
      }

      const allowed = await assertProjectAccess({
        projectId,
        workspaceId: req.workspaceId,
        userId: req.user.id,
        workspaceRole: req.workspaceRole,
      });

      if (!allowed) {
        return res.status(404).json({ success: false, message: "Project not found" });
      }

      req.projectId = projectId;
      next();
    } catch (err) {
      next(err);
    }
  };

module.exports = { requireProjectAccess };
