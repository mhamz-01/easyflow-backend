const express = require("express");
const {
  getStickyNotes,
  createStickyNote,
  updateStickyNote,
  deleteStickyNote,
} = require("../controllers/stickyNotes");

const router = express.Router();

// GET Method
router.get("/", getStickyNotes);

// POST Method
router.post("/create", createStickyNote);

// PATCH Method
router.patch("/update", updateStickyNote);

// DELETE Method
router.delete("/delete", deleteStickyNote);

module.exports = router;
