const express = require("express");
const {
  getAllDocs,
  createDoc,
  getSingleDoc,
  deleteDoc,
  updateDoc,
} = require("../controllers/documents");

const router = express.Router();

// GET Method
router.get("/", getAllDocs);
router.get("/single", getSingleDoc);

// POST Method
router.post("/create", createDoc);

// PUT Method
router.put("/update", updateDoc);

// DELETE Method
router.delete("/delete", deleteDoc);
module.exports = router;
