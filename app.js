const express = require("express");
const cookieParser = require("cookie-parser");
const { configDotenv } = require("dotenv");
const { checkConnection } = require("./src/utils/checkConnection.js");
const workspaceRoutes = require("./src/routes/workspaceRoutes.js");
const userRoutes = require("./src/routes/userRoutes.js");
const projectRoutes = require("./src/routes/projectRoutes.js");
const docsRoutes = require("./src/routes/docsRoutes.js");
const stickyNotesRoutes = require("./src/routes/stickyNotes.js");
const recentActivitiesRoutes = require("./src/routes/recentActivitiesRoutes.js");
const { clerkMiddleware, requireAuth, getAuth } = require("@clerk/express");
const cors = require("cors");
const { clerkWebHook } = require("./src/utils/clerkWebhooks.js");

configDotenv();

const app = express();
const port = process.env.PORT;

// cors
app.use(cors({ origin: process.env.ORIGIN, credentials: true }));

// Middlewares
app.use(clerkMiddleware());
app.use(cookieParser());
app.use(express.json());

// Database connection
checkConnection();

// clerk webhook
app.post(
  "/api/webhooks",
  express.raw({ type: "application/json" }),
  clerkWebHook
);

// Routers

// user route
app.use("/api/users", requireAuth(), userRoutes);

// workspace route
app.use("/api/workspace", requireAuth(), workspaceRoutes);

// project route
app.use("/api/project", requireAuth(), projectRoutes);

// docs route
app.use("/api/docs", requireAuth(), docsRoutes);

// sticky notes route
app.use("/api/stickyNotes", requireAuth(), stickyNotesRoutes);

// recent activities route
app.use("/api/recentActivities", requireAuth(), recentActivitiesRoutes);

app.get("/", (req, res) => {
  const auth = getAuth(req);
  console.log(req.headers);
  return res.json({ isAuthenticated: auth.isAuthenticated });
});
// Start server
app.listen(port, () => {
  console.log(`Backend is listening on port ${port}`);
});
