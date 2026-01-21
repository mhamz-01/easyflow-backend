const { User } = require("../database/models");
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

module.exports = {
  handleClerkUserCreated,
};
