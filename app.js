const express = require("express");
const cookieParser = require("cookie-parser");
const { configDotenv } = require("dotenv");
const workspaceRoutes = require("./src/routes/workspaceRoutes.js");
const userRoutes = require("./src/routes/userRoutes.js");
const projectRoutes = require("./src/routes/projectRoutes.js");
const docsRoutes = require("./src/routes/docsRoutes.js");
const whiteboardRoute = require("./src/routes/whiteboardRoutes.js");
const stickyNotesRoutes = require("./src/routes/stickyNotes.js");
const recentActivitiesRoutes = require("./src/routes/recentActivitiesRoutes.js");
const filesRoutes = require("./src/routes/filesRoute.js");
const tasksRoutes = require("./src/routes/tasksRoutes.js");
const errorHandler = require("./src/middlewares/errorHandler.js");
const { clerkMiddleware, requireAuth } = require("@clerk/express");
const cors = require("cors");
const { clerkWebHook } = require("./src/utils/clerkWebhooks.js");
const attachUserAndWorkspaceId = require("./src/middlewares/attachUserAndWorkspaceId.js");

configDotenv();

const app = express();

// ✅ Webhook FIRST — before express.json() and cors
app.post(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebHook,
);

// ✅ Global middleware
app.use(cors({ origin: process.env.ORIGIN, credentials: true }));
app.use(clerkMiddleware());
app.use(cookieParser());
app.use(express.json());

// ✅ Routes
app.use("/api/users", requireAuth(), attachUserAndWorkspaceId, userRoutes);
app.use("/api/workspace", requireAuth(), attachUserAndWorkspaceId, workspaceRoutes);
app.use("/api/project", requireAuth(), attachUserAndWorkspaceId, projectRoutes);
app.use("/api/docs", requireAuth(), attachUserAndWorkspaceId, docsRoutes);
app.use("/api/whiteboards", requireAuth(), attachUserAndWorkspaceId, whiteboardRoute);
app.use("/api/stickyNotes", requireAuth(), attachUserAndWorkspaceId, stickyNotesRoutes);
app.use("/api/recentActivities", requireAuth(), attachUserAndWorkspaceId, recentActivitiesRoutes);
app.use("/api/files", requireAuth(), attachUserAndWorkspaceId, filesRoutes);
app.use("/api/projects/:projectId/tasks", requireAuth(), attachUserAndWorkspaceId, tasksRoutes);

app.use(errorHandler);

// ✅ Only listen locally — Vercel handles this in production
if (process.env.NODE_ENV !== "production") {
  // cron jobs — only locally, not on Vercel
  require("./src/cron/cleanR2Files.js");

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Backend is listening on port ${port}`);
  });
}

module.exports = app;