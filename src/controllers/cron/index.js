const { cleanTempFiles } = require("../../services/cleanR2Files.service");
const { pingDatabase } = require("../../services/keepAlive.service");

// Vercel Cron Jobs call this on schedule (see vercel.json). Vercel signs the
// request with `Authorization: Bearer <CRON_SECRET>`, so we verify that
// instead of relying on Clerk auth — there's no logged-in user here.
const runCleanR2Files = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await cleanTempFiles();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Cron cleanup failed:", error);
    return res.status(500).json({ message: "Cleanup failed" });
  }
};

// Keeps the Supabase project warm (see keepAlive.service.js). Same Vercel
// Cron auth pattern as runCleanR2Files — no logged-in user for a cron hit.
const pingSupabase = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await pingDatabase();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Supabase keep-alive ping failed:", error);
    return res.status(500).json({ message: "Ping failed" });
  }
};

module.exports = { runCleanR2Files, pingSupabase };
