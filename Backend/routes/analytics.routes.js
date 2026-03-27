const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { getProfileDashboard ,getDashboardOverview,getRecentTopics,getWeakTopics,getUserRank} = require("../controllers/analytics.controller");
const {getUserInsight}=require("../controllers/AIRecommandation") 
router.get("/profile", auth, getProfileDashboard);
router.get("/dashboard", auth, getDashboardOverview);
router.get("/recent-topics", auth, getRecentTopics);
router.get("/weak-topics", auth,getWeakTopics);
router.get("/get_rank",auth,getUserRank);
router.get("/getInsight",auth,getUserInsight);

module.exports = router;