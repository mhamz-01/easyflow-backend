const express = require("express");
const { createPresignedUrl, deleteFileById } = require("../controllers/files");

const router = express.Router();

// POST Method
router.post("/presign", createPresignedUrl);

// DELETE Method
router.delete("/delete", deleteFileById);
module.exports = router;
