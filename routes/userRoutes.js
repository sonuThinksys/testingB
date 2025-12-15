const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware"); // for protected routes

// Protected routes
router.get("/", authMiddleware, userController.getUsers);
router.put("/:id", authMiddleware, userController.updateUser);
router.get("/:id", authMiddleware, userController.getUser);
router.delete("/:id", authMiddleware, userController.deleteUser);

module.exports = router;
