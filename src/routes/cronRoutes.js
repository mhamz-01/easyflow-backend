const express = require("express");
const { runCleanR2Files, pingSupabase } = require("../controllers/cron");

const router = express.Router();

// GET — Vercel Cron Jobs invoke scheduled endpoints with GET.
router.get("/clean-r2-files", runCleanR2Files);
router.get("/keep-alive", pingSupabase);

module.exports = router;
