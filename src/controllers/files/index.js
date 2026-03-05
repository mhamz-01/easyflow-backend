const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const { File } = require("../../database/models");
const {
  getUserIdUsingClerkId,
  deleteR2FileUsingKey,
} = require("../../services/auth/user.service");
const { getAuth } = require("@clerk/express");
const r2Client = require("../../config/r2");

const createPresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType, fileSize, workspaceId } = req.body;

    // get user clerkId
    const { userId: clerkId } = getAuth(req);

    // get userId using clerkId
    const userId = await getUserIdUsingClerkId(clerkId);

    // ✅ validations
    if (!fileName || !fileType || !fileSize) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    // check file size
    if (fileSize > 10 * 1024 * 1024) {
      return res.status(400).json({ message: "File too large" });
    }

    const fileKey = `temp/${userId}/${crypto.randomUUID()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 300, // 5 minutes
    });

    // 🧾 DB record (TEMP)
    const file = await File.create({
      fileKey,
      originalName: fileName,
      mimeType: fileType,
      size: fileSize,
      status: "TEMP",
      uploadedBy: userId,
    });

    return res.json({
      uploadUrl,
      fileId: file.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
};

const deleteFileById = async (req, res) => {
  try {
    const { fileId } = req.query;
    // get clerkId
    const { userId: clerkId } = getAuth(req);
    // get userId
    const userId = await getUserIdUsingClerkId(clerkId);
    const file = await File.findByPk(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // 🔐 ownership / workspace check (important)
    if (file.uploadedBy !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // 🗑️ delete from R2
    await deleteR2FileUsingKey(file.fileKey);

    // 🗑️ delete from DB
    await file.destroy();

    res.json({ success: true });
  } catch (error) {
    console.error("Delete file failed:", error);
    res.status(500).json({ message: "Failed to delete file" });
  }
};

module.exports = { createPresignedUrl, deleteFileById };
