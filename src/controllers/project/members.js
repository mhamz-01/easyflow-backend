const { z } = require("zod");
const { Project } = require("../../database/models");
const {
  listProjectMembers,
  addProjectMember,
  removeProjectMember,
} = require("../../services/project.services");

const memberBodySchema = z.object({ userId: z.number() });

// req.projectId is set by requireProjectAccess, which already confirmed the
// caller can see this project (workspace admin/owner, or an active member).
const getProjectMembers = async (req, res) => {
  try {
    const members = await listProjectMembers(req.projectId);
    return res.status(200).json({ success: true, members });
  } catch (error) {
    console.error("[getProjectMembers]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const addMember = async (req, res) => {
  try {
    const { userId } = memberBodySchema.parse(req.body);

    const project = await Project.findOne({
      where: { id: req.projectId, workspaceId: req.workspaceId },
      attributes: ["id"],
    });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const member = await addProjectMember(req.projectId, userId, req.user.id);
    return res.status(200).json({ success: true, member });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ success: false, message: "Invalid input", errors: error.errors });
    }
    console.error("[addMember]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const removeMember = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const removed = await removeProjectMember(req.projectId, userId, req.user.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Active membership not found" });
    }

    return res.status(200).json({ success: true, message: "Member removed" });
  } catch (error) {
    console.error("[removeMember]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Self-service leave — always targets the caller, no project:manage-members
// permission required.
const leaveProject = async (req, res) => {
  try {
    const removed = await removeProjectMember(req.projectId, req.user.id, req.user.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Active membership not found" });
    }

    return res.status(200).json({ success: true, message: "Left project" });
  } catch (error) {
    console.error("[leaveProject]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { getProjectMembers, addMember, removeMember, leaveProject };
