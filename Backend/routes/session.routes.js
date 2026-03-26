const express = require("express");
const router = express.Router();

const {
  getSessionSummary,
  getAttemptReview,
} = require("../controllers/session.controller");

const auth = require("../middlewares/auth.middleware");


// Session summary (small analytics after submit)
router.get(
  "/:sessionId/summary",
  auth,
  getSessionSummary
);


// Attempt review (detailed mode)
router.get(
  "/:sessionId/review",
  auth,
  getAttemptReview
);


module.exports = router;