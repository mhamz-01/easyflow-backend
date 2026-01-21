// this controller contains all CRUD operations for workspace api

const { Workspace, WorkspaceMember } = require("../../database/models");
const { createWorkspaceSchema } = require("./schemas");
const { createSlug } = require("../../utils");
const { getAuth } = require("@clerk/express");
const { Op } = require("sequelize");

/**
 * Check if a user has a workspace
 * @body = userID (optional if using Clerk auth)
 * @returns { hasWorkspace: boolean }
 */
const checkUserWorkspace = async (req, res) => {
  try {
    // Prefer getting userId from Clerk auth
    const { userId } = getAuth(req);
    // Count or find workspaces for this user
    const workspace = await Workspace.findOne({
      where: { admin: userId }, // admin is the owner of workspace
      order: [["createdAt", "DESC"]],
    });
    if (workspace) {
      return res.status(200).json({
        success: true,
        hasWorkspace: true,
        workspaceSlug: workspace.workspaceSlug,
      });
    } else {
      return res.status(200).json({
        success: false,
        hasWorkspace: false,
      });
    }
  } catch (error) {
    console.error("[Workspace] Error checking user workspace:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while checking workspace",
      error: error.message,
    });
  }
};

/**
 * Create a workspace
 * @param body: { workspaceName }
 * return newly created workspace
 */
const createWorkspace = async (req, res) => {
  try {
    // get userId from clerk auth
    const { userId } = getAuth(req);

    // validate incoming data
    const data = createWorkspaceSchema.parse(req.body);

    // create a slug for workspace using its name
    const workspaceSlug = createSlug(req.body.workspaceName);

    // ensure slug is unique for every user workspace
    const existing = await Workspace.findOne({
      where: { workspaceSlug: workspaceSlug, admin: userId },
    });
    if (existing) {
      console.log(
        "[Workspace] Workspace already exists for this user",
        workspaceSlug
      );
      return res.status(201).json({
        success: false,
        message: "Workspace with this name already exists",
      });
    }

    // create workspace
    const newWorkspace = await Workspace.create({
      admin: userId,
      workspaceName: data.workspaceName,
      workspaceSlug: workspaceSlug,
      isSelected: true,
    });
    console.log("[Workspace] Workspace created successfully:", newWorkspace.id);

    return res.status(201).json({
      success: true,
      workspace: newWorkspace,
      message: "workspace creates successfully",
    });
  } catch (error) {
    console.log("[Workspace] Error creating workspace:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating workspace",
      error: error.message,
    });
  }
};

/**
 *  This function fetches all the workspaces for specified users, using their IDs
 */
const getUserWorkspaces = async (req, res) => {
  try {
    // Get user id from Clerk
    const { userId } = getAuth(req);
    // Find workspaces where user is either admin or a member
    const workspaces = await Workspace.findAll({
      where: {
        [Op.or]: [
          { admin: userId }, // check if user is admin
        ],
      },
      include: [
        {
          model: WorkspaceMember,
          where: { userId },
          required: false, // include only if exists
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({
      success: true,
      data: workspaces,
    });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch workspaces",
    });
  }
};

/**
 * This function returns user workspace using workspaceSlug provided in params
 * @param {*} req
 * @param {*} res
 */
const getSingleWorkspace = async (req, res) => {
  try {
    const { workspaceSlug } = req.query;

    console.log("[getSingleWorkspace] incoming slug:", workspaceSlug);

    if (!workspaceSlug) {
      console.warn("[getSingleWorkspace] missing workspaceSlug");

      return res.status(400).json({
        success: false,
        message: "workspaceSlug is required",
      });
    }

    console.log("[getSingleWorkspace] querying workspace...");

    const workspace = await Workspace.findOne({
      where: { workspaceSlug },
    });

    if (!workspace) {
      console.warn(
        "[getSingleWorkspace] workspace not found for slug:",
        workspaceSlug
      );

      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    console.log(
      "[getSingleWorkspace] workspace found:",
      workspace.id ?? "id-not-available"
    );

    return res.status(200).json({
      success: true,
      workspace,
    });
  } catch (error) {
    console.error("[getSingleWorkspace] unexpected error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateWorkspaceName = async (req, res) => {
  try {
    const { workspaceSlug, newWorkspaceName } = req.query;

    if (!workspaceSlug || !newWorkspaceName) {
      return res
        .status(400)
        .json({ message: "Slug and workspaceName are required" });
    }

    // Check if another workspace already has the new name
    const existingWorkspace = await Workspace.findOne({
      where: { workspaceName: newWorkspaceName.toString() },
    });

    if (existingWorkspace) {
      return res
        .status(409)
        .json({ message: "A workspace with this name already exists" });
    }

    // Update workspace
    const newWorkspaceSlug = createSlug(newWorkspaceName);
    const [updatedCount, updatedRows] = await Workspace.update(
      {
        workspaceName: newWorkspaceName.toString(),
        workspaceSlug: newWorkspaceSlug,
      },
      { where: { workspaceSlug: workspaceSlug.toString() }, returning: true }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    return res.status(200).json({ data: updatedRows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE Method
const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceSlug } = req.query;
    const { userId } = getAuth(req);
    console.log("workspace slug0", workspaceSlug);
    if (!workspaceSlug) {
      return res.status(400).json({ message: "Workspace slug is required" });
    }

    const deletedCount = await Workspace.destroy({
      where: { workspaceSlug, admin: userId },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    return res.status(200).json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createWorkspace,
  checkUserWorkspace,
  getUserWorkspaces,
  getSingleWorkspace,
  updateWorkspaceName,
  deleteWorkspace,
};
