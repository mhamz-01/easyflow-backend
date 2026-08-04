const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { clerkClient } = require("@clerk/express");
const r2Client = require("../../config/r2");
const { User } = require("../../database/models");
const { NotFoundError } = require("../../utils/AppError");
/**
 * Creates or updates a user from Clerk data. Accepts either a raw webhook
 * event payload (snake_case) or a Clerk Backend API user resource
 * (camelCase, used by the getUser() self-heal fallback below) — this is
 * the one place that knows how to read either shape.
 * This function is idempotent.
 */
const handleClerkUserCreated = async (clerkUser) => {
  const email =
    clerkUser.email_addresses?.[0]?.email_address ??
    clerkUser.emailAddresses?.[0]?.emailAddress;
  const clerkID = clerkUser.id;

  if (!email) {
    throw new Error("Email not found in Clerk payload");
  }
  const payload = {
    username: clerkUser.first_name ?? clerkUser.firstName ?? "Anonymous",
    imageUrl: clerkUser.image_url ?? clerkUser.imageUrl ?? null,
    email,
    clerkId: clerkID,
  };
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
    throw new NotFoundError("User not found");
  }

  return user.username;
};

const getUserIdUsingClerkId = async (clerkId) => {
  if (!clerkId) {
    throw new Error("ClerkId is required");
  }
  let user = await User.findOne({
    where: { clerkId },
    attributes: ["id"],
  });

  if (!user) {
    // The Clerk -> DB webhook may not have landed yet — or, in local dev,
    // may never land at all, since Clerk's cloud can't deliver webhooks to
    // localhost. Rather than depend on that delivery, self-heal on the
    // very first authenticated request: pull the profile straight from
    // Clerk's API and upsert it ourselves.
    const clerkUser = await clerkClient.users.getUser(clerkId).catch(() => null);
    if (clerkUser) {
      await handleClerkUserCreated(clerkUser);
      user = await User.findOne({ where: { clerkId }, attributes: ["id"] });
    }
  }

  // Thrown as a 404 (not a generic 500) so callers — e.g. the onboarding
  // page — can tell "your account is still being provisioned, retry" apart
  // from a real server error. Reachable now only if Clerk itself doesn't
  // know this clerkId either (e.g. stale/forged session).
  if (!user) {
    throw new NotFoundError("User not found");
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
