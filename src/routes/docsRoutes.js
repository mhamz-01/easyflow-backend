const express = require("express");
const {
  getAllDocs,
  createDoc,
  getSingleDoc,
  deleteDoc,
  updateDoc,
  assignDoc,
  listDocAccess,
  grantDocAccess,
  revokeDocAccess,
  setDefaultAccess,
} = require("../controllers/documents");
const { requireDocumentAccess } = require("../middlewares/requireDocumentAccess");
const { requirePermission } = require("../middlewares/requirePermission");


const router = express.Router();

// GET Method
router.get("/", getAllDocs);
router.get("/single", requireDocumentAccess("view"), getSingleDoc);

// POST Method
router.post("/create", createDoc);

// PUT Method
router.put("/update", requireDocumentAccess("edit"), updateDoc);

// DELETE Method
router.delete("/delete", requireDocumentAccess("edit"), deleteDoc);

// Assign Method — notify/share list, not an access grant (unchanged)
router.post("/assign", assignDoc);

// Access-control management — public documents only, admin/owner only
router.get("/:id/access", requireDocumentAccess("view"), listDocAccess);
router.post("/:id/access", requirePermission("document:manage-access"), grantDocAccess);
router.delete(
  "/:id/access/:userId",
  requirePermission("document:manage-access"),
  revokeDocAccess,
);

// Default access — creator or admin/owner (checked in the controller)
router.patch("/:id/default-access", requireDocumentAccess("view"), setDefaultAccess);

module.exports = router;
