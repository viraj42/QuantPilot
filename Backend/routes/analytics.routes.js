const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { getProfileDashboard ,getDashboardOverview,getRecentTopics,getWeakTopics} = require("../controllers/analytics.controller");

router.get("/profile", auth, getProfileDashboard);
router.get("/dashboard", auth, getDashboardOverview);
router.get("/recent-topics", auth, getRecentTopics);
router.get("/weak-topics", auth,getWeakTopics);
module.exports = router;