// services/FileService.js
const { Task, User, File, sequelize } = require("../database/models");

const updateFilesById = async (filesId, transaction = null) => {
  try {
    // Validate input
    if (!filesId || !Array.isArray(filesId) || filesId.length === 0) {
      throw new Error("filesId must be a non-empty array");
    }

    // Update files status from TEMP to ATTACHED
    const [updatedCount] = await File.update(
      { status: "ATTACHED" },
      {
        where: {
          id: filesId,
          status: "TEMP",
        },
        transaction, // Pass transaction to the update operation
      },
    );

    return {
      success: true,
      updatedCount,
      message: `${updatedCount} file(s) updated successfully`,
    };
  } catch (error) {
    console.error("Error updating files:", error);
    throw error;
  }
};

module.exports = { updateFilesById };
