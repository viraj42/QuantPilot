const express = require("express");
const router = express.Router();
const topicController = require("../controllers/topic.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// Admin only
router.post("/", authMiddleware, adminMiddleware, topicController.createTopic);

// Public
router.get("/:sectionId", topicController.getTopicsBySection);

module.exports = router;
