const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../../config/r2");
const { User } = require("../../database/models");
/**
 * Creates or updates a user from Clerk data
 * This function is idempotent
 */
const handleClerkUserCreated = async (clerkUser) => {
  const email = clerkUser.email_addresses?.[0]?.email_address;
  const clerkID = clerkUser.id;

  if (!email) {
    throw new Error("Email not found in Clerk payload");
  }
  const payload = {
    username: clerkUser.fullName || clerkUser.first_name || "Anonymous",
    imageUrl: clerkUser.image_url || null,
    email,
    clerkId: clerkID,
  };
  console.log("payload", payload);
  await User.upsert(payload);
};

const getUserName = async (clerkId) => {
  if (!clerkId) {
    throw new Error("clerkId is required");
  }

  const user = await User.findOne({
    where: { clerkId },
    attributes: ["username"],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.username;
};

const getUserIdUsingClerkId = async (clerkId) => {
  if (!clerkId) {
    throw new Error("ClerkId is required");
  }
  const user = await User.findOne({
    where: { clerkId },
    attributes: ["id"],
  });

  // throw error user not found
  if (!user) {
    throw new Error("User not found");
  }

  return user.id;
};

const deleteR2FileUsingKey = async (fileKey) => {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    }),
  );
};

module.exports = {
  handleClerkUserCreated,
  getUserName,
  getUserIdUsingClerkId,
  deleteR2FileUsingKey,
};
