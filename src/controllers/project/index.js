const { z } = require("zod");
const { Workspace, Project } = require("../../database/models");
const { createProjectSchema } = require("./schemas");

const updateProjectSchema = z.object({
  type: z.enum(["public", "private"]).optional(),
  name: z.string().min(1).optional(),
});
const { getWorkspaceBySlug } = require("../../services/workspace.services");
const { getProjectsForSidebar } = require("../../services/project.services");

/**
 * Create a project using project name
 */
const createProject = async (req, res) => {
  try {
    // Validate incoming data
    const validatedData = createProjectSchema.parse(req.body);
    // workspaceId always comes from the authenticated request context, never
    // trusted from the body — otherwise a caller authorized for one
    // workspace (via the x-workspace-id header requirePermission checked)
    // could create a project inside a different workspace by just naming a
    // different id in the JSON payload.
    const newProject = await Project.create({
      name: validatedData.projectName,
      workspaceId: req.workspaceId,
      admin: validatedData.admin,
      lead: validatedData.lead || "",
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: newProject,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
/**
 * Fetch all projects associated with a workspace
 */
const getProjectsByWorkspaceSlug = async (req, res) => {
  try {
    const { slug: workspaceSlug } = req.query;

    // req.user is already populated by attachUserAndWorkspaceId — no need
    // to look the user up again here.
    const userId = req.user.id;

    if (!workspaceSlug) {
      return res.status(400).json({
        success: false,
        message: "workspaceSlug is required",
      });
    }

    const workspace = await getWorkspaceBySlug(workspaceSlug);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const projects = await getProjectsForSidebar(workspace.id, userId, req.workspaceRole);

    return res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      projects,
    });
  } catch (error) {
    console.error("[getProjectsByWorkspaceSlug]", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * DELETE /project/delete?projectId=123
 */
const deleteProject = async (req, res) => {
  try {
    const projectId = Number(req.query.projectId);
    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, message: "Project ID is required" });
    }

    // Scoped to req.workspaceId so a caller authorized for one workspace
    // can't delete a project belonging to a different one just by knowing
    // its id.
    const deleted = await Project.destroy({
      where: { id: projectId, workspaceId: req.workspaceId },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
/**
 * PATCH /project/:projectId
 * Currently only exposes flipping public <-> private (and renaming) —
 * this is the control an admin needs before the "Members" UI means
 * anything, since a brand new project is always created public.
 */
const updateProject = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const updates = updateProjectSchema.parse(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No changes provided" });
    }

    // Scoped to req.workspaceId, same reasoning as deleteProject.
    const [updatedCount] = await Project.update(updates, {
      where: { id: projectId, workspaceId: req.workspaceId },
    });

    if (!updatedCount) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const project = await Project.findByPk(projectId, {
      attributes: ["id", "name", "type"],
    });

    return res.status(200).json({ success: true, project });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ success: false, message: "Invalid input", errors: error.errors });
    }
    console.error("[updateProject]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getProjectsByWorkspaceSlug,
  createProject,
  updateProject,
  deleteProject,
};
