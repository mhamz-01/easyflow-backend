const express = require("express");
const cookieParser = require("cookie-parser");
const workspaceRoutes = require("./src/routes/workspaceRoutes.js");
const userRoutes = require("./src/routes/userRoutes.js");
const projectRoutes = require("./src/routes/projectRoutes.js");
const docsRoutes = require("./src/routes/docsRoutes.js");
const whiteboardRoute = require("./src/routes/whiteboardRoutes.js");
const stickyNotesRoutes = require("./src/routes/stickyNotes.js");
const recentActivitiesRoutes = require("./src/routes/recentActivitiesRoutes.js");
const filesRoutes = require("./src/routes/filesRoute.js");
const tasksRoutes = require("./src/routes/tasksRoutes.js");
const chatRoutes = require("./src/routes/chatRoutes.js");
const cronRoutes = require("./src/routes/cronRoutes.js");
const errorHandler = require("./src/middlewares/errorHandler.js");
const { clerkMiddleware, requireAuth } = require("@clerk/express");
const cors = require("cors");
const { clerkWebHook } = require("./src/utils/clerkWebhooks.js");
const attachUserAndWorkspaceId = require("./src/middlewares/attachUserAndWorkspaceId.js");

// ✅ Only load dotenv locally — Railway/Vercel inject vars directly
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: `.env.${process.env.NODE_ENV || "development"}` });
  // node-cron only works in a long-running process, so it's for local dev only.
  // In production (Vercel), scheduled cleanup runs via the /api/cron route below,
  // triggered by Vercel Cron Jobs (see vercel.json).
  require("./src/cron/cleanR2Files.js");
}

// Log-and-continue instead of letting a stray bug (e.g. a typo'd variable
// in a catch block) take down the whole process for every in-flight request.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

const app = express();

// ✅ Webhook FIRST — before express.json() and cors
app.post(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebHook,
);

// ✅ Cron endpoint — called by Vercel Cron Jobs, not a logged-in user,
// so it's registered before Clerk's requireAuth() and secured with its own check.
app.use("/api/cron", cronRoutes);

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
app.use("/api/chat", requireAuth(), attachUserAndWorkspaceId, chatRoutes);

app.use(errorHandler);

// ✅ Only bind a port when run directly (Railway/local: `node app.js`).
// On Vercel, api/index.js requires this module and exports it as a
// serverless handler instead — Vercel manages the request lifecycle itself,
// so calling app.listen() there would be wrong (no persistent process/port).
if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Backend is listening on port ${port}`);
  });
}

module.exports = app;

