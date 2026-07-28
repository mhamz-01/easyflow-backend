// cron/cleanupFiles.js
// Local development only — node-cron needs a long-running process, which
// Vercel serverless functions are not. In production this same cleanup runs
// via the /api/cron/clean-r2-files route, invoked on schedule by Vercel Cron
// Jobs (see vercel.json + src/routes/cronRoutes.js).
const cron = require("node-cron");
const { cleanTempFiles } = require("../services/cleanR2Files.service");

cron.schedule("0 0 * * *", async () => {
  console.log("🧹 Running file cleanup job...");
  const { scanned, deleted } = await cleanTempFiles();
  console.log(`🧹 Cleanup done — scanned ${scanned}, deleted ${deleted}`);
});
