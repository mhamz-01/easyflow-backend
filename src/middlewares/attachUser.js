const { getAuth } = require("@clerk/express");
const { getUserIdUsingClerkId } = require("../services/auth/user.service");

const attachUser = async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);

    const dbUserId = await getUserIdUsingClerkId(clerkId);
    if (!dbUserId) {
      return res.status(404).json({ message: "User not found" });
    }

    // insert user object in every req
    req.user = { id: dbUserId };
    next();
  } catch (err) {
    next(err); // pass to your error handler
  }
};

module.exports = attachUser;
