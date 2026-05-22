const express = require("express");
const {
  getAllDocs,
  createDoc,
  getSingleDoc,
  deleteDoc,
  updateDoc,
  assignDoc
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

// Assgin Method
router.post("/assign", assignDoc);
module.exports = router;
