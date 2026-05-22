const express = require("express");
const {
  getAllWhiteboards,
  createWhiteboard,
  getSingleWhiteboard,
  deleteWhiteboard,
  updateWhiteboard,
  assignWhiteboard
} = require("../controllers/whiteboards");


const router = express.Router();

// GET Method
router.get("/", getAllWhiteboards);
router.get("/single", getSingleWhiteboard);

// POST Method
router.post("/create", createWhiteboard);

// PUT Method
router.put("/update", updateWhiteboard);

// DELETE Method
router.delete("/delete", deleteWhiteboard);

// ASSIGN Whiteboard Method
router.post("/assign", assignWhiteboard);

module.exports = router;