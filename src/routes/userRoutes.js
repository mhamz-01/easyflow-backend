const express = require("express");
const { deleteUser, getMe } = require("../controllers/user");
const router = express.Router();

router.get("/me", getMe);
router.delete("/delete", deleteUser);

module.exports = router;
