const { verifyWebhook } = require("@clerk/express/webhooks");
const { handleClerkUserCreated } = require("../services/auth/user.service");

const clerkWebHook = async (req, res) => {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).send("Error verifying webhook");
  }

  try {
    // create/update the user in our database before acking the webhook.
    // handleClerkUserCreated is an upsert, so it's safe for Clerk to retry
    // this delivery if we fail below.
    if (evt.type === "user.created" || evt.type === "user.updated") {
      await handleClerkUserCreated(evt.data);
    }

    return res.send("Webhook received");
  } catch (err) {
    console.error("Error syncing Clerk user to database:", err);
    // non-2xx tells Clerk to retry the delivery instead of treating a
    // failed DB write as a successful signup
    return res.status(500).send("Error syncing user");
  }
};

module.exports = { clerkWebHook };
