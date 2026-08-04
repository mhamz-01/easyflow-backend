const { assertProjectChannelAccess } = require("../services/project.services");

// Runs after requirePermission("chat:read"/"chat:post") (workspace-role
// gate) and, on POST, after validate(sendMessageSchema) so req.body.projectId
// is already coerced. Absent projectId = General, no extra check needed.
// Returns 404 rather than 403 for a denied private project so a non-member
// can't tell a project with that id even exists in this workspace.
const requireChatChannelAccess = () => async (req, res, next) => {
  try {
    const raw = req.method === "GET" ? req.query.projectId : req.body.projectId;
    if (raw === undefined) return next();

    const projectId = Number(raw);
    const allowed = await assertProjectChannelAccess({
      projectId,
      workspaceId: req.workspaceId,
      userId: req.user.id,
    });

    if (!allowed) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireChatChannelAccess };
