const { Op } = require("sequelize");
const { File } = require("../database/models");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../config/r2");

const cleanTempFiles = async () => {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);

  const files = await File.findAll({
    where: {
      status: "TEMP",
      taskId: null,
      createdAt: { [Op.lt]: cutoff },
    },
  });

  let deleted = 0;
  for (const file of files) {
    try {
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: file.fileKey,
        }),
      );
      await file.destroy();
      deleted++;
    } catch (err) {
      console.error("Failed to delete file:", file.id, err);
    }
  }

  return { scanned: files.length, deleted };
};

module.exports = { cleanTempFiles };
