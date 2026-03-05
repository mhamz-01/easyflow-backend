const { clerkClient, getAuth } = require("@clerk/express");
const { handleClerkUserCreated } = require("../../services/auth/user.service");
const { clerkUserSchema } = require("../../validators/clerk.validator");
const { User, Workspace } = require("../../database/models");
/**
 * Clerk webhook handler
 * Handles user.created and user.updated events
 */
const createUser = async (req, res) => {
  try {
    const payload = req.body;

    // Validate incoming webhook payload
    const parsed = clerkUserSchema.safeParse(payload);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid Clerk payload",
        errors: parsed.error.errors,
      });
    }

    const { type, data } = parsed.data;

    // Only handle relevant events
    if (!["user.created", "user.updated"].includes(type)) {
      return res.status(200).json({ message: "Event ignored" });
    }

    await handleClerkUserCreated(data);

    return res.status(201).json({
      message: "User synced successfully",
    });
  } catch (error) {
    console.error("Clerk webhook error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    /**
     * 1. Delete user from Clerk
     */
    await clerkClient.users.deleteUser(userId);

    // /**
    //  * 2. Delete user from database
    //  */
    await User.destroy({
      where: { clerkId: userId },
    });

    /**
     * 3. Delete all workpsaces created by this user
     */
    await Workspace.destroy({
      where: { admin: userId },
    });
    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      message: "Failed to delete user",
    });
  }
};

module.exports = {
  createUser,
  deleteUser,
};
