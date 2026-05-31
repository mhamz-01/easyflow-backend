const app = require('./app');
const express = require("express");
const cookieParser = require("cookie-parser");
const { configDotenv } = require("dotenv");
const { checkConnection } = require("./src/utils/checkConnection.js");
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


const { clerkMiddleware, requireAuth, getAuth } = require("@clerk/express");
const cors = require("cors");
const { clerkWebHook } = require("./src/utils/clerkWebhooks.js");
const { neon } = require("@neondatabase/serverless");

// cron jobs
require("./src/cron/cleanR2Files.js");

configDotenv();

// .env variable
const sql = neon(process.env.DATABASE_URL);
const http = require("http");
const attachUserAndWorkspaceId = require("./src/middlewares/attachUserAndWorkspaceId.js");
const app = express();
const port = process.env.PORT;

// cors
app.use(cors({ origin: process.env.ORIGIN, credentials: true }));
// Middlewares
app.use(clerkMiddleware());
app.use(cookieParser());
app.use(express.json());


// app.use(attachUserAndWorkspaceId);

// clerk webhook
app.post("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebHook);






// Routers

// user route
app.use("/api/users", requireAuth(),attachUserAndWorkspaceId, userRoutes);

// workspace route
app.use("/api/workspace", requireAuth(),attachUserAndWorkspaceId, workspaceRoutes);

// project route
app.use("/api/project", requireAuth(),attachUserAndWorkspaceId, projectRoutes);

// docs route
app.use("/api/docs", requireAuth(),attachUserAndWorkspaceId, docsRoutes);

// whiteboard route 
app.use("/api/whiteboards",  requireAuth(),attachUserAndWorkspaceId, whiteboardRoute);

// sticky notes route
app.use("/api/stickyNotes", requireAuth(),attachUserAndWorkspaceId, stickyNotesRoutes);

// recent activities route
app.use("/api/recentActivities", requireAuth(),attachUserAndWorkspaceId, recentActivitiesRoutes);

// Files route
app.use("/api/files", requireAuth(),attachUserAndWorkspaceId, filesRoutes);

// Task route
app.use("/api/projects/:projectId/tasks", requireAuth(),attachUserAndWorkspaceId, tasksRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend is listening on port ${port}`);
  });
}

module.exports = app;