const express = require("express");
const router = express.Router();
const sectionController = require("../controllers/section.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// Admin only
router.post("/section", authMiddleware, adminMiddleware, sectionController.createSection);

// Public
router.get("/section", sectionController.getSections);



module.exports = router;
