const express = require("express");
const { runCleanR2Files } = require("../controllers/cron");

const router = express.Router();

// GET — Vercel Cron Jobs invoke scheduled endpoints with GET.
router.get("/clean-r2-files", runCleanR2Files);

module.exports = router;
