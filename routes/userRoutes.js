const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeUser = require("../middleware/authMiddleware").authorizeUser;

// Protected routes
router.get("/", authMiddleware, userController.getUsers);
router.put("/:id", authMiddleware, authorizeUser, userController.updateUser);
router.get("/:id", authMiddleware, authorizeUser, userController.getUser);
router.delete("/:id", authMiddleware, authorizeUser, userController.deleteUser);

module.exports = router;
