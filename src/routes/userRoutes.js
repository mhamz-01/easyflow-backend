const express = require("express");
const { deleteUser } = require("../controllers/user");
const router = express.Router();

router.delete("/delete", deleteUser);

module.exports = router;
