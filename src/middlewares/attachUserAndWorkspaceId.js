const { getAuth } = require("@clerk/express");
const { getUserProfileUsingClerkId } = require("../services/auth/user.service");

const attachUser = async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    const workspaceId = Number(req.headers["x-workspace-id"]);
    const user = await getUserProfileUsingClerkId(clerkId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // insert user object in every req — id is the field every existing
    // controller reads; username/email/imageUrl are additive so routes that
    // need author display info (e.g. chat) can skip a second lookup.
    req.user = user;
    req.workspaceId = workspaceId;
    next();
  } catch (err) {
    next(err); // pass to your error handler
  }
};

module.exports = attachUser;