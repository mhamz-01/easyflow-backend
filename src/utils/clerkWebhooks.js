const { verifyWebhook } = require("@clerk/express/webhooks");
const { handleClerkUserCreated } = require("../services/auth/user.service");

const clerkWebHook = async (req, res) => {
  try {
    const evt = await verifyWebhook(req);
    // create a user in database
    if (evt.type === "user.created" || evt.type === "user.updated") {
      handleClerkUserCreated(evt.data);
    }

    return res.send("Webhook received");
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).send("Error verifying webhook");
  }
};

module.exports = { clerkWebHook };
