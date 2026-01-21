const { Workspace, Project } = require("../../database/models");
const { createProjectSchema } = require("./schemas");

/**
 * Create a project using project name
 */
const createProject = async (req, res) => {
  try {
    // Validate incoming data
    const validatedData = createProjectSchema.parse(req.body);
    console.log("validatedData", validatedData);
    // Create project in DB
    const newProject = await Project.create({
      name: validatedData.projectName,
      workspaceId: validatedData.workspaceId,
      admin: validatedData.admin,
      members: validatedData.members || "",
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

    if (!workspaceSlug) {
      return res.status(400).json({
        success: false,
        message: "workspaceSlug is required",
      });
    }

    // Ensure workspace exists
    const workspace = await Workspace.findOne({
      where: { workspaceSlug },
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }
    // Fetch projects using workspace.id
    const projects = await Project.findAll({
      where: { workspaceId: workspace.id },
      order: [["createdAt"]],
    });
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

    const deleted = await Project.destroy({ where: { id: projectId } });

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
module.exports = {
  getProjectsByWorkspaceSlug,
  createProject,
  deleteProject,
};
