const express = require("express");
const router = express.Router();
const analyticsController=require("../controllers/analytics.controller")
const authMiddleware = require("../middlewares/auth.middleware");
const practiceController = require("../controllers/practice.controller");
const { getLevelRoadmap } = require("../controllers/level.controller");

router.get("/home",authMiddleware,analyticsController.getPracticeHome);

router.get("/section/:sectionId",authMiddleware,analyticsController.getSectionTopics)

router.get("/levels/:topicId",authMiddleware,getLevelRoadmap)

// Start Practice Session
router.post(
  "/start",
  authMiddleware,
  practiceController.startSession
);



// Submit Practice Session
router.post(
  "/submit",
  authMiddleware,
  practiceController.submitSession
);

module.exports = router;