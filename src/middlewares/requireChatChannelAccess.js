const { ChatChannel } = require("../database/models");
const { assertProjectChannelAccess } = require("../services/project.services");

// Runs after requirePermission("chat:read"/"chat:post") (workspace-role
// gate) and, on POST, after validate(sendMessageSchema) so req.body.projectId
// is already coerced. Absent projectId = General, no extra check needed.
// Returns 404 rather than 403 for a denied private project so a non-member
// can't tell a project with that id even exists in this workspace.
//
// A sub-channel's visibility is exactly its parent project's — there is no
// separate per-channel ACL. channelId is only ever used here to confirm it
// actually belongs to the projectId the caller named (closes a spoofing
// path: naming a public project's id alongside a private project's real
// channel id).
const requireChatChannelAccess = () => async (req, res, next) => {
  try {
    const source = req.method === "GET" ? req.query : req.body;
    const rawProjectId = source.projectId;
    const rawChannelId = source.channelId;

    if (rawProjectId === undefined) return next();

    const projectId = Number(rawProjectId);

    if (rawChannelId !== undefined) {
      const channel = await ChatChannel.findOne({
        where: { id: Number(rawChannelId), projectId },
        attributes: ["id"],
      });
      if (!channel) {
        return res.status(404).json({ success: false, message: "Channel not found" });
      }
    }

    const allowed = await assertProjectChannelAccess({
      projectId,
      workspaceId: req.workspaceId,
      userId: req.user.id,
      workspaceRole: req.workspaceRole,
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
