const { Op } = require("sequelize");
const { Task, User, File, sequelize } = require("../database/models");

const updateFilesById = async (filesId, taskId, transaction = null) => {
  if (!Array.isArray(filesId) || filesId.length === 0) {
    throw new Error("filesId must be a non-empty array");
  }

  const [updatedCount] = await File.update(
    {
      status: "ATTACHED",
      taskId,
    },
    {
      where: {
        id: { [Op.in]: filesId }, // ✅ fix
        status: "TEMP",
      },
      transaction,
    },
  );

  return {
    success: true,
    updatedCount,
  };
};

module.exports = { updateFilesById };