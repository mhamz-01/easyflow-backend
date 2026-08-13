const express = require("express");
const {
  getAllWhiteboards,
  createWhiteboard,
  getSingleWhiteboard,
  deleteWhiteboard,
  updateWhiteboard,
  assignWhiteboard,
  listWhiteboardAccess,
  grantWhiteboardAccess,
  revokeWhiteboardAccess,
  setWhiteboardDefaultAccess,
} = require("../controllers/whiteboards");
const { requireWhiteboardAccess } = require("../middlewares/requireWhiteboardAccess");
const { requirePermission } = require("../middlewares/requirePermission");


const router = express.Router();

// GET Method
router.get("/", getAllWhiteboards);
router.get("/single", requireWhiteboardAccess("view"), getSingleWhiteboard);

// POST Method
router.post("/create", createWhiteboard);

// PUT Method
router.put("/update", requireWhiteboardAccess("edit"), updateWhiteboard);

// DELETE Method
router.delete("/delete", requireWhiteboardAccess("edit"), deleteWhiteboard);

// ASSIGN Whiteboard Method
router.post("/assign", assignWhiteboard);

// Access-control management — public whiteboards only, admin/owner only
router.get("/:id/access", requireWhiteboardAccess("view"), listWhiteboardAccess);
router.post("/:id/access", requirePermission("whiteboard:manage-access"), grantWhiteboardAccess);
router.delete(
  "/:id/access/:userId",
  requirePermission("whiteboard:manage-access"),
  revokeWhiteboardAccess,
);

// Default access — creator or admin/owner (checked in the controller)
router.patch("/:id/default-access", requireWhiteboardAccess("view"), setWhiteboardDefaultAccess);

module.exports = router;