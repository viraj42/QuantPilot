const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const {
  getCompanies,
  generateMock,
  startMock,
  submitMock,
  getMockResult,
  getMockHistory,
} = require("../controllers/mock.controller");

// ── Public ────────────────────────────────────────────────────
router.get("/companies", getCompanies);

// ── Authenticated ─────────────────────────────────────────────

// Generate a new frozen mock paper for a company
// POST /api/mock/generate
// Body: { companyId }
router.post("/generate", auth, generateMock);

// Start / resume a mock (set timer, return questions)
// GET /api/mock/:mockAttemptId/start
router.get("/:mockAttemptId/start", auth, startMock);

// Submit mock answers
// POST /api/mock/:mockAttemptId/submit
// Body: { answers: [{ questionId, selectedAnswer, timeTaken }] }
router.post("/:mockAttemptId/submit", auth, submitMock);

// Get full result with section-wise analytics
// GET /api/mock/:mockAttemptId/result
router.get("/:mockAttemptId/result", auth, getMockResult);

// Get user's mock history (all submitted mocks)
// GET /api/mock/history
router.get("/history", auth, getMockHistory);

module.exports = router;